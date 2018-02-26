"use strict";

const LocalizedModel = use("LocalizedModel");

class LocalizeDatabase {
  async handle({ locale, request }, next) {
    LocalizedModel.currentLocale = locale;

    // call next to advance the request
    await next();
  }

  async wsHandle({ request }, next) {
    // call next to advance the request
    await next();
  }
}

module.exports = LocalizeDatabase;
