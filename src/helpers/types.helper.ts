import { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify';

export type DeepKey<T> = T extends object
  ? // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    T extends Function
    ? string
    : {
        [K in keyof T]-?: K extends string | number ? `${K}` | `${K}.${DeepKey<T[K]>}` : never;
      }[keyof T]
  : never;

export type RouteHandler<T extends RouteGenericInterface> = (
  req: FastifyRequest<T>,
  res: FastifyReply<T>,
) => Promise<void>;

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
