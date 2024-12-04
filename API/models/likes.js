const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('likes', {
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
      allowNull: true,
      references: {
        model: 'post',
        key: 'id'
      }
    },
    comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comment',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('like','dislike'),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'likes',
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
      {
        name: "comment_id",
        using: "BTREE",
        fields: [
          { name: "comment_id" },
        ]
      },
    ]
  });
};
