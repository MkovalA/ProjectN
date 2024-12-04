const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('post', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    author: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    publish_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active','inactive'),
      allowNull: true,
      defaultValue: "active"
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'post',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "author",
        using: "BTREE",
        fields: [
          { name: "author" },
        ]
      },
    ]
  });
};
