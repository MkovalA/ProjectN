const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    login: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: "login"
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: "email"
    },
    verification_email: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    profile_picture: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    role: {
      type: DataTypes.ENUM('user','admin'),
      allowNull: true,
      defaultValue: "user"
    }
  }, {
    sequelize,
    tableName: 'user',
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
        name: "login",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "login" },
        ]
      },
      {
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
    ]
  });
};
