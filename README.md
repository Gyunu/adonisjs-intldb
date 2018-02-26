# AdonisJS International Database

This package extends AdonisJS Lucid model to facilitate internationalization of database entities.

Install the package with the following NPM command:

```bash
npm install @ungonnak/intldb
```

## How it works

This package enforces the use of an extra table for each internationalized entity of the database.

So, for example, you have two tables `projects`, `project_types`, you'll need to create `projects_translations` and 
`project_types_translations` to accommodate the properties that needs translation.

## Configuration

1. Add the provider to your `start/app.js` file: 
    ```javascript
    const providers = [
      // ...
      "@ungonnak/adonisjs-intldb/providers/IntldbProvider",
      // ...
    ];
    ```
    
2. Add the middleware to `globalMiddleware` section of your `start/kernel.js` file:
    ```javascript
    const globalMiddleware = [
      // ...
      "Ungonnak/Intldb/Middleware/LocalizeDatabase",
      // ...
    ];
    ```

3. Create a migration to the `languages` table:
    ```javascript
    "use strict";
    
    const Schema = use("Schema");
    
    class LanguagesSchema extends Schema {
      up() {
        this.create("languages", (table) => {
          table.string("name");
          table.string("code").primary();
          table.timestamps(false, true);
        });
      }
    
      down() {
        this.drop("languages");
      }
    }
    
    module.exports = LanguagesSchema;
    ```

4. Add the languages that you want to support in your project.

## Making a model international

1. Create a model that extends the `LocalizedModel` class, in this example `ProjectType`:
    ```javascript
    "use strict";
    
    const LocalizedModel = use("LocalizedModel");
    
    class ProjectType extends LocalizedModel {
    }
    
    module.exports = ProjectType;
    ```

2. Create the migration for the `project_types` table:
    ```javascript
    "use strict";
    
    const Schema = use("Schema");
    
    class ProjectTypesSchema extends Schema {
      up() {
        this.create("project_types", (table) => {
          table.increments().unsigned();
          table.timestamps(false, true);
        });
      }
    
      down() {
        this.drop("project_types");
      }
    }
    
    module.exports = ProjectTypesSchema;
    ```

3. And the migration for the international info for the `project_types` table:
    ```javascript
    "use strict";
    
    const Schema = use("Schema");
    
    class ProjectTypesTranslationSchema extends Schema {
      up() {
        this.create("project_types_translations", (table) => {
          table.increments().unsigned();
          table.integer("project_type_id").unsigned();
          table.string("language_code");
          table.string("name");
          table.timestamps(false, true);
          
          table.foreign(["project_type_id", "language_code"])
            .onDelete("CASCADE")
            .onUpdate("RESTRICT")
            .references(["project_types.id", "languages.code"]);
        });
      }
    
      down() {
        this.drop("project_types_translations");
      }
    }
    
    module.exports = ProjectTypesTranslationSchema;
    ```
4. Use the model class like you aways used, but remember that the language that will be used is defined by the
`LocalizeDatabase` middleware. If you, for some reason, need to change the language, change the `currentLocale` of
the `LocalizedModel` class like this:
    ```javascript
    LocalizedModel = use ("LocalizedModel");
    
    // ...
    
    LocalizedModel.currentLocale = "fr";
    
    // Do some stuff in the french records
    
    LocalizedModel.currentLocale = "en";
    
    // Do some stuff in the english records
    
    // ...
    ```
