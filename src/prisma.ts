import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { getDMMF } from '@prisma/sdk';
import type { DMMF } from '@prisma/generator-helper';

const prisma = new PrismaClient();
const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');

let dmmf: DMMF.Document;

async function initDMMF() {
  dmmf = await getDMMF({ datamodel: schema });
}

export default prisma;
export { dmmf, initDMMF };
