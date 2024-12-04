const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('comment', {
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
    publish_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'post',
        key: 'id'
      }
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
    tableName: 'comment',
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
      {
        name: "post_id",
        using: "BTREE",
        fields: [
          { name: "post_id" },
        ]
      },
    ]
  });
};
