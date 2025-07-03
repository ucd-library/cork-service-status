import { faker } from '@faker-js/faker';

class PGSampleData {

  /*
      data = [
        {
            name: 'steak',
            title: 'instead live aside',
            tags: [ 'tag1', 'tag5', 'tag4' ],
            user: {
            creator_firstName: 'Joey',
            creator_lastName: 'Schroeder',
            username: 'Lora.Will'
            },
            serviceProperties: [ [Object], [Object], [Object], [Object] ]
        },
        {
            name: 'making',
            title: 'simplistic compromise skeleton',
            tags: [ 'tag5' ],
            user: {
            creator_firstName: 'Abdiel',
            creator_lastName: 'King',
            username: 'Lacey77'
            },
            role: 'public',
            serviceProperties: [ [Object], [Object], [Object] ]
        },
        {
            name: 'ice-cream',
            title: 'yippee',
            tags: [ 'tag2', 'tag4', 'tag5' ],
            user: {
            creator_firstName: 'Lesly',
            creator_lastName: 'Willms',
            username: 'Eleonore47'
            },
            serviceProperties: [ [Object], [Object], [Object], [Object], [Object] ]
        }
        ]
  */

  /**
   * Generate properties array of fake service objects.
   * @returns {Array<Object>} - Array of service objects.
   */
  createServiceProperties(){
    const propertyNames = ['is_dev', 'support_url', 'technical_lead', 'url', 'admin_url', 'technical_lead_backup', 'health_dashboard', 'restart_instructions'];

    const selectedNames = faker.helpers.arrayElements(propertyNames, { min: 3, max: 5 });

    return selectedNames.map((name, index) => {
        const prop = { name, valueOrder: index };

        if (name === 'is_dev') {
            prop.value = true;
        } else if (name === 'support_url') {
            const supportUrlCount = faker.number.int({ min: 1, max: 5 });
            prop.value = Array.from({ length: supportUrlCount }, () => faker.internet.url());
        } else if (name === 'technical_lead') {
            prop.value = faker.person.fullName();
        } else if (name === 'url') {
            const urlCount = faker.number.int({ min: 1, max: 5 });
            prop.value = Array.from({ length: urlCount }, () => faker.internet.url());

        } else if (name === 'admin_url') {
            const adminUrlCount = faker.number.int({ min: 1, max: 5 });
            prop.value = Array.from({ length: adminUrlCount }, () => faker.internet.url());
        } else if (name === 'technical_lead_backup') {
            const backupUrlCount = faker.number.int({ min: 1, max: 5 });
            prop.value = Array.from({ length: backupUrlCount }, () => faker.internet.url());
        } else if (name === 'health_dashboard') {
            const healthUrlCount = faker.number.int({ min: 1, max: 5 });
            prop.value = Array.from({ length: healthUrlCount }, () => faker.internet.url());
        } else if (name === 'restart_instructions') {
            const lineCount = faker.number.int({ min: 1, max: 5 });

            prop.value = Array.from({ length: lineCount }, () => {
              const command = faker.hacker.verb() + ' ' + faker.hacker.noun();
              return `- \`${command}\`: ${faker.hacker.phrase()}`;
            }).join('\n');
        }
        // Randomly assign role
        if (faker.datatype.boolean()) {
          prop.role = 'public';
        }

        return prop;
      });

  }

  /**
   * Generate an array of fake service objects.
   * @param {number} size - Number of service records to generate.
   * @returns {Array<Object>} - Array of service objects.
   */
  createSampleData(size) {
    const data = Array.from({ length: size }).map(() => {
      const username = faker.internet.username();

      return {
        name: faker.word.noun(),
        title: faker.word.words({ min: 1, max: 3 }),
        tags: faker.helpers.arrayElements(['tag1', 'tag2', 'tag3', 'tag4', 'tag5'], { min: 1, max: 3 }),
        user: {
            creator_firstName: faker.person.firstName(),
            creator_lastName: faker.person.lastName(),
            username: username,
        },
        ...(faker.datatype.boolean() && { role: 'public' }),
        serviceProperties: this.createServiceProperties()
      };
    });

    return data;
  }
}

export default PGSampleData;
