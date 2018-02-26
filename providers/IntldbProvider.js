"use strict";

/*
 * adonisjs-intldb
 *
 * (c) Ungonnak <developers@ungonnak.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const { ServiceProvider } = require("@adonisjs/fold");

class IntldbProvider extends ServiceProvider {

  _registerMiddleware() {
    this.app.bind("Ungonnak/Intldb/Middleware/LocalizeDatabase", (app) => {
      const LocalizeDatabase = require("../src/Middleware/LocalizeDatabase");
      return new LocalizeDatabase();
    });
  }

  _registerModel() {
    this.app.bind("Ungonnak/Intldb/LocalizedModel", (app) => require("../src/LocalizedModel"));
    this.app.alias("Ungonnak/Intldb/LocalizedModel", "LocalizedModel");
  }

  register() {
    this._registerMiddleware();
    this._registerModel();
  }

  boot() {
  }

}

module.exports = IntldbProvider;
