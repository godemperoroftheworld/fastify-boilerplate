import { HttpStatusCode } from 'axios';

import PrismaService, { PrismaServiceParams } from '@/services/PrismaService';
import { PrismaModel, PrismaModelName } from '@/helpers/prisma.helper';
import { IdParams, SearchQuery } from '@/schemas';
import { RouteHandler } from '@/helpers/types.helper';

export type PrismaQueryParams<N extends PrismaModelName> = Omit<
  PrismaServiceParams<N>,
  'filter'
> & {
  filter?: string;
};

export default abstract class PrismaController<N extends PrismaModelName> {
  protected constructor(protected readonly service: PrismaService<N>) {}

  // If these are methods, `this` returns as undefined for some reason when called from fastify.

  public readonly post: RouteHandler<{
    Body: PrismaModel<N>;
    Querystring: PrismaQueryParams<N>;
  }> = async (req, res) => {
    const data = req.body as PrismaModel<N>;
    const result = await this.service.createOne(data, req.query);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly put: RouteHandler<{
    Params: IdParams;
    Querystring: PrismaQueryParams<N>;
    Body: Partial<PrismaModel<N>>;
  }> = async (req, res) => {
    const { id } = req.params;
    const data = req.body as Partial<PrismaModel<N>>;
    const result = await this.service.updateOne(id, data, req.query);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly get: RouteHandler<{
    Params: IdParams;
    Querystring: PrismaQueryParams<N>;
  }> = async (req, res) => {
    const { id } = req.params;
    const result = await this.service.getOne(id, req.query);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly getAll: RouteHandler<{
    Querystring: PrismaQueryParams<N>;
  }> = async (req, res) => {
    const result = await this.service.getMany(req.query);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly getWithPost: RouteHandler<{
    Body: PrismaServiceParams<N>;
  }> = async (req, res) => {
    const result = await this.service.getMany(req.body);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly search: RouteHandler<{
    Querystring: SearchQuery & PrismaQueryParams<N>;
  }> = async (req, res) => {
    const { query, ...params } = req.query;
    const result = await this.service.searchMany(query, params);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly searchOne: RouteHandler<{
    Querystring: SearchQuery;
  }> = async (req, res) => {
    const { query } = req.query;
    const result = await this.service.searchOne(query);
    res.status(HttpStatusCode.Ok).send(result);
  };

  public readonly count: RouteHandler<{
    Body: Pick<PrismaServiceParams<N>, 'filter'>;
  }> = async (req, res) => {
    const result = await this.service.count(req.body);
    res.status(HttpStatusCode.Ok).send(result);
  };
}
