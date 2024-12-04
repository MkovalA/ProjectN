const SequelizeAuto = require('sequelize-auto');
const auto = new SequelizeAuto('ProjectN', 'mkoval', '12345Cow', {
    host: 'localhost',
    dialect: 'mysql',
    directory: './models',
    caseModel: 'c',
    caseFile: 'c',
});

auto.run().then(data => {
  console.log(data.tables);      // table and field list
  console.log(data.foreignKeys); // table foreign key list
  console.log(data.indexes);     // table indexes
  console.log(data.hasTriggerTables); // tables that have triggers
  console.log(data.relations);   // relationships between models
  console.log(data.text)         // text of generated models
});

