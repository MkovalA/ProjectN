const db = require("./db.js");

class Model {
    #table_name;
    #object;

    constructor(table_name, object) {
        this.#table_name = table_name;
        this.#object = object;
    }

    set object(obj) {
        this.#object = obj;
    }

    get object() {
        return this.#object;
    }
    
    get db() {
        return db;
    }

    async find(id) {
        try {
            const [res] = await db.execute(`SELECT * FROM ${this.#table_name} WHERE id = ?`, [id]);
            if (res.length > 0) {
                this.#object = res[0];
                return this.#object;
            } else {
                console.log("ID not found %d", this.#object.id);
                throw new Error("ID not found %d", this.#object.id);
            }
        } catch(err) {
            console.log(err.message);
        }
    }

    async delete() {
        if (this.#object.id) {
            try {
                const [res] = await db.execute(`DELETE FROM ${this.#table_name} WHERE id = ?`, [this.#object.id]);
                console.log("Success delete");
            } catch(err) {
                console.log(err.message);
            }
        } else {
            console.log("No found id to delete");
        }
    }
    
    async save() {
        const [check] = await db.execute(`SELECT id FROM ${this.#table_name} WHERE id = ?`, [this.#object.id]);
        if (check.length > 0) {
            try {
                const colums_name = Object.keys(this.#object).filter(name => name !== "id").map(name => `${name} = ?`).join(", ");
                const values_in_colums = Object.values(this.#object).slice(1);
                const [res] = await db.execute(`UPDATE ${this.#table_name} SET ${colums_name} WHERE id = ?`, [...values_in_colums, this.#object.id]);
                console.log("Success update");
            } catch(err) {
                throw new Error(err.message);
            }
        } else {
            try {
                const colums_name = Object.keys(this.#object).filter(name => name !== "id").join(", ");
                const values_in_colums = Object.values(this.#object).slice(1);
                const insert_val = Object.keys(this.#object).filter(name => name !== "id").map(name => "?").join(", ");
                console.log(colums_name, values_in_colums, insert_val);
                const [res] = await db.execute(`INSERT INTO ${this.#table_name} (${colums_name}) VALUES (${insert_val})`, [...values_in_colums]);
                console.log("Success insert");
            } catch(err) {
                console.log(err.message);
                throw new Error(err.message);
            }
        }
    }
}

module.exports = Model;
