#!/usr/bin/env node

import { Command } from 'commander';
import PGSampleData from './lib/faker.js';
import Services from '../lib/services.js'

const program = new Command();

program
  .name('seed')
  .description('A data seed generator for cork status')
  .version('1.0.0')
  .option('-s, --services <number>', 'number of services')
  .action(async (options) => {
    let services = options.services || 1;
    console.log(`Services Created: ${services}`);

    //Create fake data
    const generator = new PGSampleData();  
    const data = generator.createSampleData(services);

    //Call create method
    const result = await Services.create(data);
    console.log("Results:\n");
    console.dir(result.res, { depth: null, maxArrayLength: null });



  });

program.parse(process.argv);
