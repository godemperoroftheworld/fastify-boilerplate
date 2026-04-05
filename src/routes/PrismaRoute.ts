import z from 'zod';
import { FastifyInstance, RouteHandlerMethod } from 'fastify';

import { PrismaModel, PrismaModelExpanded, PrismaModelName } from '@/helpers/prisma.helper';
import PrismaController from '@/controllers/PrismaController';
import { idParams, prismaBody, searchQuery } from '@/schemas';
import { DeepPartial } from '@/helpers/types.helper';

type FixedPrismaModel<N extends PrismaModelName> = Partial<PrismaModel<N>> & z.ZodRawShape;

export default class PrismaRoute<N extends PrismaModelName> {
  protected constructor(
    public readonly prefix: Lowercase<N>,
    protected readonly controller: PrismaController<N>,
    private readonly requestSchema: z.input<z.ZodObject<FixedPrismaModel<N>>>,
    private readonly responseSchema: z.ZodType<DeepPartial<PrismaModelExpanded<N>>>,
  ) {}

  protected routes(server: FastifyInstance) {
    server.post(
      '/all',
      {
        schema: {
          tags: [this.prefix],
          body: prismaBody.nullable(),
          response: { 200: z.array(this.responseSchema) },
        },
      },
      this.controller.getWithPost as RouteHandlerMethod,
    );
    server.post(
      '/count',
      {
        schema: {
          tags: [this.prefix],
          body: prismaBody.pick({ filter: true }).nullable().optional(),
        },
      },
      this.controller.count as RouteHandlerMethod,
    );
    server.post(
      '/',
      {
        schema: {
          tags: [this.prefix],
          params: idParams,
          querystring: prismaBody.nullable(),
          body: this.requestSchema,
          response: { 200: this.responseSchema },
        },
      },
      this.controller.post as RouteHandlerMethod,
    );
    server.put(
      '/:id',
      {
        schema: {
          tags: [this.prefix],
          params: idParams,
          querystring: prismaBody.nullable(),
          body: this.requestSchema.partial(),
          response: { 200: this.responseSchema },
        },
      },
      this.controller.put as RouteHandlerMethod,
    );
    server.get(
      '/',
      {
        schema: {
          tags: [this.prefix],
          querystring: prismaBody.nullable(),
          response: { 200: z.array(this.responseSchema) },
        },
      },
      this.controller.getAll as RouteHandlerMethod,
    );
    server.get(
      '/:id',
      {
        schema: {
          tags: [this.prefix],
          params: idParams,
          querystring: prismaBody.nullable(),
          response: { 200: this.responseSchema },
        },
      },
      this.controller.get as RouteHandlerMethod,
    );
    server.get(
      '/search',
      {
        schema: {
          tags: [this.prefix],
          querystring: searchQuery.merge(prismaBody),
          response: { 200: z.array(this.responseSchema) },
        },
      },
      this.controller.search as RouteHandlerMethod,
    );
    server.get(
      '/searchOne',
      {
        schema: {
          tags: [this.prefix],
          querystring: searchQuery.merge(prismaBody),
          response: { 200: z.nullable(this.responseSchema) },
        },
      },
      this.controller.searchOne as RouteHandlerMethod,
    );
  }

  public register(fastify: FastifyInstance) {
    fastify.register(
      async (server) => {
        this.routes(server);
      },
      { prefix: `/${this.prefix}` },
    );
  }
}
