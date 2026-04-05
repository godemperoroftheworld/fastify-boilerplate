import { Prisma, PrismaClient } from '@prisma/client';
import { isPlainObject, mapValues, merge, set } from 'lodash';
import prismaFQP from '@krsbx/prisma-fqp';
import z from 'zod';
import { keyBy } from 'lodash';

import prisma, { dmmf } from '@/prisma';
import { DeepKey } from '@/helpers/types.helper';
import {
  PrismaFilter,
  PrismaModel,
  PrismaModelExpanded,
  PrismaModelName,
} from '@/helpers/prisma.helper';
import { IdParams } from '@/schemas';
import SortOrderSchema from '@/schemas/zod/inputTypeSchemas/SortOrderSchema';

// Args
type PrismaOperations<N extends PrismaModelName> = Prisma.TypeMap['model'][N]['operations'];
type PrismaArgs<N extends PrismaModelName> = Partial<PrismaOperations<N>['findFirst']['args']>;
type PrismaCreateArgs<N extends PrismaModelName> = Partial<PrismaOperations<N>['create']['args']>;
type PrismaUpdateArgs<N extends PrismaModelName> = Partial<PrismaOperations<N>['update']['args']>;

// Filters
export type PrismaServiceParams<N extends PrismaModelName> = Partial<{
  select: DeepKey<Required<PrismaModelExpanded<N>>>[];
  filter: PrismaFilter<N> | string;
  include: DeepKey<Required<PrismaModelExpanded<N>>>[];
  omit: DeepKey<Required<PrismaModelExpanded<N>>>[];
  take: number;
  skip: number;
  orderBy: Array<[DeepKey<Required<PrismaModelExpanded<N>>>, z.infer<typeof SortOrderSchema>]>;
}>;

// Prisma repository
interface PrismaRepositoryBase<
  N extends PrismaModelName,
  T extends PrismaModelExpanded<N> = PrismaModelExpanded<N>,
> {
  findUnique: (args: PrismaArgs<N>) => Promise<T | null>;
  findUniqueOrThrow: (args: PrismaArgs<N>) => Promise<T>;
  findMany: (args: PrismaArgs<N>) => Promise<T[]>;
  create: (args: PrismaCreateArgs<N>) => Promise<T>;
  createMany: (args: PrismaCreateArgs<N>) => Promise<{ count: number }>;
  aggregateRaw: (args: {
    pipeline?: Prisma.InputJsonValue[];
    options?: Prisma.InputJsonValue;
  }) => Promise<Prisma.JsonObject>;
  update: (args: PrismaUpdateArgs<N>) => Promise<T>;
  count: (args: PrismaArgs<N>) => Promise<number>;
}

export default abstract class PrismaService<N extends PrismaModelName> {
  private static buildFilter<N extends PrismaModelName>(filter: string): PrismaFilter<N> {
    return prismaFQP(filter);
  }

  private static mergeSelectAndInclude<N extends PrismaModelName>(
    obj: { include: object; select: object } & { [key: string]: true },
  ): object {
    if (!isPlainObject(obj)) return obj;
    if (obj.select && obj.include) {
      return {
        select: merge(
          {},
          obj.select,
          mapValues(obj.include, PrismaService.mergeSelectAndInclude<N>),
        ),
      };
    }
    return mapValues(obj, (value: typeof obj) =>
      isPlainObject(value) ? PrismaService.mergeSelectAndInclude<N>(value) : value,
    );
  }

  protected readonly repository: PrismaClient[Lowercase<N>];
  protected constructor(private property: Lowercase<N>) {
    this.repository = prisma[property];
  }

  private buildComplexObject(
    keys: DeepKey<Required<PrismaModelExpanded<N>>>[],
    type: 'include' | 'select',
  ) {
    let currentModel = this.model;
    // Pad keys with type
    const mapped = keys.map((key) => {
      // Split key since each part is an additional level of nesting
      const splitKey = key.split('.');
      const fixedKey = splitKey.reduce((result: string, keySegment, idx, arr) => {
        // Get the field from the model
        const field = currentModel.fields.find((f) => f.name === keySegment)!;
        if (field.relationName && idx + 1 !== arr.length) {
          // Relation fields we try and nest, unless its the last segment of the key
          currentModel = this.findModel(field.type.toLowerCase() as Lowercase<PrismaModelName>)!;
          return result + (result.length ? '.' : '') + `${keySegment}.${type}`;
        } else {
          // Otherwise we just append the key segment
          return result + (result.length ? '.' : '') + `${keySegment}`;
        }
      }, '');
      // Build an object from the padded out string
      return set({}, fixedKey, true);
    });
    // Merge mapped objects
    const flexibleObject = merge({}, ...mapped);
    // We have to fold in select / include in the cases where there's both
    return PrismaService.mergeSelectAndInclude<N>(flexibleObject);
  }

  private buildSimpleObject(keys: DeepKey<Required<PrismaModelExpanded<N>>>[]) {
    const mapped = keys.map((key) => {
      return set({}, key, true);
    });
    return merge({}, ...mapped);
  }

  private buildIncludes(keys: DeepKey<Required<PrismaModelExpanded<N>>>[]): PrismaFilter<N> {
    return this.buildComplexObject(keys, 'include');
  }

  private buildSelects(keys: DeepKey<Required<PrismaModelExpanded<N>>>[]): object {
    return this.buildComplexObject(keys, 'select');
  }

  private buildOrderBy(
    orders: Array<[DeepKey<Required<PrismaModelExpanded<N>>>, z.infer<typeof SortOrderSchema>]>,
  ) {
    return orders.map(([key, order]) => {
      return { [key]: order };
    });
  }

  private get repositoryBase() {
    return this.repository as unknown as PrismaRepositoryBase<N>;
  }

  protected abstract searchPath(): string;

  protected get models() {
    return dmmf!.datamodel.models;
  }

  protected get model() {
    return this.findModel(this.property)!;
  }

  protected findModel(name: Lowercase<PrismaModelName>) {
    return this.models.find((model) => model.name.toLowerCase() === name);
  }

  public async getOne(
    id: string,
    params: Omit<PrismaServiceParams<N>, 'filter' | 'take' | 'skip'> = {},
  ): Promise<PrismaModelExpanded<N>> {
    const { include, select, omit, orderBy, ...rest } = params;
    return this.repositoryBase.findUniqueOrThrow({
      where: { id },
      select: select ? this.buildSelects(select) : undefined,
      include: include && !select ? this.buildIncludes(include) : undefined,
      omit: omit ? this.buildSimpleObject(omit) : undefined,
      orderBy: orderBy ? this.buildOrderBy(orderBy) : undefined,
      ...rest,
    } as PrismaArgs<N>);
  }

  public async getOneByProperty<K extends keyof PrismaModel<N>>(
    property: K,
    value: PrismaModel<N>[K],
    params: Omit<PrismaServiceParams<N>, 'filter' | 'take' | 'skip'> = {},
  ): Promise<PrismaModelExpanded<N>> {
    const { include, select, omit, orderBy, ...rest } = params;
    return this.repositoryBase.findUniqueOrThrow({
      where: { [property]: value } as unknown as PrismaFilter<N>,
      select: select ? this.buildSelects(select) : undefined,
      include: include && !select ? this.buildIncludes(include) : undefined,
      omit: omit ? this.buildSimpleObject(omit) : undefined,
      orderBy: orderBy ? this.buildOrderBy(orderBy) : undefined,
      ...rest,
    } as PrismaArgs<N>);
  }

  public async getMany(params: PrismaServiceParams<N> = {}): Promise<PrismaModelExpanded<N>[]> {
    const { select, filter, include, omit, orderBy, ...rest } = params;
    const fixedFilter = typeof filter === 'string' ? PrismaService.buildFilter(filter) : filter;

    return this.repositoryBase.findMany({
      where: fixedFilter,
      select: select ? this.buildSelects(select) : undefined,
      include: include && !select ? this.buildIncludes(include) : undefined,
      omit: omit ? this.buildSimpleObject(omit) : undefined,
      orderBy: orderBy ? this.buildOrderBy(orderBy) : undefined,
      ...rest,
    } as PrismaArgs<N>);
  }

  public async count(params: Pick<PrismaServiceParams<N>, 'filter'> = {}): Promise<number> {
    const { filter } = params;
    const fixedFilter = typeof filter === 'string' ? PrismaService.buildFilter(filter) : filter;
    return this.repositoryBase.count({
      where: fixedFilter,
    } as PrismaArgs<N>);
  }

  public async searchOne(
    query: string,
    fuzzy: boolean = true,
    params: Pick<PrismaServiceParams<N>, 'include' | 'select' | 'omit'> = {},
  ): Promise<PrismaModelExpanded<N> | null> {
    const searchResult = (
      await this.repository.aggregateRaw({
        pipeline: [
          {
            $search: {
              index: 'search',
              text: {
                query,
                path: this.searchPath(),
                fuzzy: fuzzy
                  ? {
                      prefixLength: 1,
                    }
                  : undefined,
              },
              sort: { score: { $meta: 'searchScore', order: -1 } },
            },
          },
          {
            $addFields: {
              score: { $meta: 'searchScore' },
            },
          },
          {
            $match: {
              score: { $gt: 3 },
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: false,
              id: { $toString: '$_id' },
              score: true,
            },
          },
        ],
      })
    )[0] as IdParams;
    if (searchResult) {
      const { id } = searchResult;
      return this.getOne(id, params);
    }
    return null;
  }

  public async searchMany(
    query: string,
    params: Omit<PrismaServiceParams<N>, 'filter'> = {},
  ): Promise<PrismaModelExpanded<N>[]> {
    const searchResults = (await this.repository.aggregateRaw({
      pipeline: [
        {
          $search: {
            index: 'search',
            autocomplete: {
              query,
              path: this.searchPath(),
              fuzzy: {
                prefixLength: 1,
              },
            },
            sort: { score: { $meta: 'searchScore', order: -1 } },
          },
        },
        {
          $addFields: {
            score: { $meta: 'searchScore' },
          },
        },
        {
          $match: {
            score: { $gte: 1 },
          },
        },
        {
          $project: {
            _id: false,
            id: { $toString: '$_id' },
            score: true,
          } as Prisma.InputJsonValue,
        },
      ],
    })) as unknown as IdParams[];
    if (searchResults.length) {
      const ids = searchResults
        .slice(params.skip ?? 0)
        .slice(0, params.take)
        .map((x) => x.id);
      const results = await this.getMany({
        filter: { id: { in: ids } },
        ...params,
      });
      // Results is not in the same order, restore the order here
      const keyedResults = keyBy(results, 'id');
      return ids.map((id) => keyedResults[id]);
    }
    return [];
  }

  public async createOne(
    data: Omit<PrismaModel<N>, 'id'>,
    params: Pick<PrismaServiceParams<N>, 'select' | 'include' | 'omit'> = {},
  ): Promise<PrismaModelExpanded<N>> {
    const { id } = await this.repositoryBase.create({
      data,
    } as unknown as PrismaCreateArgs<N>);
    return this.getOne(id, params);
  }

  public async createMany(
    data: Omit<PrismaModel<N>, 'id'>[],
    params: Omit<PrismaServiceParams<N>, 'filter' | 'take' | 'skip'> = {},
  ): Promise<PrismaModelExpanded<N>[]> {
    await this.repositoryBase.createMany({
      data,
    } as unknown as PrismaCreateArgs<N>);
    const searchPath = this.searchPath()[0] as keyof Omit<PrismaModel<N>, 'id'>;
    return this.repositoryBase.findMany({
      where: {
        [searchPath]: { in: data.map((d) => d[searchPath]) },
      } as unknown as PrismaFilter<N>,
      ...params,
    } as PrismaArgs<N>);
  }

  public async updateOne(
    id: string,
    data: Partial<Omit<PrismaModel<N>, 'id'>>,
    params: Pick<PrismaServiceParams<N>, 'select' | 'include' | 'omit'> = {},
  ): Promise<PrismaModelExpanded<N>> {
    await this.repositoryBase.update({
      where: { id },
      select: { id: true },
      data,
    } as PrismaUpdateArgs<N>);
    return this.getOne(id, params);
  }

  public async updateOneByProperty<K extends keyof PrismaModel<N>>(
    key: K,
    value: PrismaModel<N>[K],
    data: Partial<Omit<PrismaModel<N>, 'id'>>,
    params: Pick<PrismaServiceParams<N>, 'select' | 'include' | 'omit'> = {},
  ) {
    const { id } = await this.repositoryBase.update({
      where: { [key]: value } as unknown as PrismaFilter<N>,
      select: { id: true },
      data,
    } as PrismaUpdateArgs<N>);
    return this.getOne(id, params);
  }
}
