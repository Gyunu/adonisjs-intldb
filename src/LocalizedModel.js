"use strict";

const _ = use("lodash");
const pluralize = use("pluralize");

const Antl = use("Antl");
const Database = use("Database");
const Model = use("Model");
const Server = use("Server");

let _currentLocale;

/* @todo Implementar serializador para enviar a data de atualização do registro utilizando a data da tabela de tradução. */
class LocalizedModel extends Model {

  static set currentLocale(value) {
    _currentLocale = value;
  }

  get localizedAttributes() {
    throw new Error("Implement localizedAttributes method in your " + Object.getPrototypeOf(this).constructor.name + " model class");
  }

  get localizedForeignKey() {
    return `${_.snakeCase(pluralize.singular(this.constructor.table))}_id`;
  }

  get localizedTableName() {
    return this.constructor.table + "_translations";
  }

  _instantiate() {
    super._instantiate();

    this.__setters__.push("___languageCode");
    this.__setters__.push("$localizedAttributes");

    this.$localizedAttributes = {};
  }

  static boot() {
    super.boot();

    this.addHook("afterFind", async (modelInstance) => {
      await this._localize(modelInstance);
    });

    this.addHook("afterFetch", async (instances) => {
      for (const instance of instances) {
        await this._localize(instance);
      }
    });

    this.addHook("beforeSave", async (instance) => {
      if (instance.$attributes.hasOwnProperty("___languageCode")) {
        instance.___languageCode = instance.$attributes.___languageCode;
      }

      Reflect.deleteProperty(instance.$attributes, "___languageCode");

      const properties = instance.localizedAttributes;

      for (const property of properties) {
        if (!instance[property]) {
          continue;
        }

        instance.$localizedAttributes[property] = instance[property];

        Reflect.deleteProperty(instance.$attributes, property);
      }
    });

    this.addHook("afterSave", async (instance) => {
      let languageCode = _currentLocale;
      if (instance.hasOwnProperty("___languageCode")) {
        languageCode = instance.___languageCode;
      }

      const count = await Database
        .from(instance.localizedTableName)
        .where(instance.localizedForeignKey, instance.id)
        .where("language_code", languageCode)
        .count();

      if (count["count(*)"]) {
        await LocalizedModel._updateLocalizedTable(languageCode, instance);
      } else {
        await LocalizedModel._insertInLocalizedTable(languageCode, instance);
      }

      for (const attribute in instance.$localizedAttributes) {
        instance.$attributes[attribute] = instance.$attributes[attribute] = instance.$localizedAttributes[attribute];
      }
    });
  }

  static async _localize(modelInstance) {
    const attributes = modelInstance.localizedAttributes;
    const localizedData = await Database
      .table(modelInstance.localizedTableName)
      .where(modelInstance.localizedForeignKey, modelInstance.id)
      .where("language_code", _currentLocale)
      .first();

    if (localizedData) {
      for (const property of attributes) {
        if (localizedData.hasOwnProperty(property)) {
          modelInstance[property] = localizedData[property];
        }
      }
    }
  }

  static _insertInLocalizedTable(languageCode, instance) {
    const data = {
      ...instance.$localizedAttributes,
      "language_code": languageCode
    };

    data[instance.localizedForeignKey] = instance.id;

    return Database
      .insert(data)
      .into(instance.localizedTableName);
  }

  static _updateLocalizedTable(languageCode, instance) {
    return Database
      .table(instance.localizedTableName)
      .where(instance.localizedForeignKey, instance.id)
      .where("language_code", languageCode)
      .update({ ...instance.$localizedAttributes, "updated_at": Database.fn.now() });
  }

}

module.exports = LocalizedModel;
