import { Prisma } from '@prisma/client';
import { GetResult } from '@prisma/client/runtime/library';

// Base types
export type PrismaModelName =
    Prisma.TypeMap['model'][keyof Prisma.TypeMap['model']]['payload']['name'];
type PrismaPayload<T extends PrismaModelName> = Prisma.TypeMap['model'][T]['payload'];
export type PrismaObjects<T extends PrismaModelName> = PrismaPayload<T>['objects'];

export type PrismaModel<T extends PrismaModelName> = GetResult<PrismaPayload<T>, object>;
export type PrismaModelExpanded<T extends PrismaModelName> = PrismaPayload<T>['scalars'] & {
  [K in keyof PrismaObjects<T>]?: PrismaObjects<T>[K] extends Array<{
    name: infer N extends PrismaModelName;
  }>
    ? PrismaModel<N>[]
    : PrismaObjects<T>[K] extends {
          name: infer N extends PrismaModelName;
        }
      ? PrismaModelExpanded<N>
      : never;
};
export type PrismaFilter<T extends PrismaModelName> =
  Prisma.TypeMap['model'][T]['operations']['findFirst']['args']['where'];
