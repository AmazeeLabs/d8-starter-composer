# Amazee Drupal 8 Starter

A Drupal 8 starter project built with Composer.

The starter lives at http://d8-starter-composer.io.dev.dev1.compact.amazee.io/ (be sure to export/commit/push any config changes you make)

How to setup a new project from d8-starter-composer: http://confluence.amazeelabs.com/display/KNOWLEDGE/Create+new+Drupal+8+Composer+project

TL;DR
```composer create-project --stability dev --no-interaction --keep-vcs --repository '{"type": "vcs","url": "https://github.com/AmazeeLabs/d8-starter-composer"}' AmazeeLabs/d8-starter-composer awesome-new-project_com```

## Important notes about Composer

### If using Docker: don't change dependencies outside the container

With amazee.io local stack, most of Mac and Windows users run Composer commands outside the Docker container because file system works faster in this case. This is perfectly fine to run `composer install` in this way. But running `composer update` and `composer require` outside the container may lead to issues. The reason is:
- Composer considers OS type and PHP version while bulding the dependency tree
- Composer packages can depend on OS type and PHP version
- your OS type and PHP version may differ from the container ones

So the safer way is to *always run `composer update` and `composer require` from the Docker container*.

BTW, this is true for most of other dependency managers: `npm`, `yarn`, etc.

### Running `composer require` prior to `composer install` can lead to dependencies update

If you just cloned a repository and want to add a new package to the project, *run `composer install` before `composer require`*. Otherwise Composer can update other project dependencies without your request.

## Recipes

The most recent version of the following recipes can be found at https://github.com/AmazeeLabs/d8-starter-composer#readme

### Installing contrib modules

See the [official documentation](https://www.drupal.org/docs/develop/using-composer/using-composer-to-manage-drupal-site-dependencies#adding-modules). Some examples:

- ```composer require drupal/<MODULE_NAME>:~1.0``` to get latest stable version (or latest dev, if there is no stable release)
- ```composer require drupal/<MODULE_NAME>:1.x-dev``` to get latest dev version
- ```composer require drupal/<MODULE_NAME>:1.x-dev#<COMMIT_HASH>``` to get specific version

### Updating Drupal core/modules

1. Run `composer update` (add `--dry-run` to just check for updates)
1. Run `drush -y updb`
1. Export possible config changes with `drush -y config-export`
1. Check via Git if there are any changes made to the Drupal core files (this can be done by `drupal-composer/drupal-scaffold`), review them carefully, ensure that all Amazee-specific stuff is still on its place
1. Commit/push changes

### Patching packages

```
    "extra": {
        "patches": {
            "<PACKAGE/NAME>": {
                "<PATCH DESCRIPTION>": "<PATH/TO/PATCH>",
                ...
            },
            ...
        },
        "composer-exit-on-patch-failure": true
    }
```

Example:

```
    "extra": {
        "patches": {
            "drupal/core": {
                "HEKS-102 Fix language detection": "patches/2189267-24.patch"
            }
        },
        "composer-exit-on-patch-failure": true
    }
```

After a new patch is added run
- `composer install` to apply patch
- `composer update --lock` to make `composer-patches` plugin write necessary changes to the `composer.lock` file

### Installing custom/forked modules from Github repository

#### For the case if module repository contains its own `composer.json`

```
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/<REPOSITORY/NAME>"
        },
        ...
    ],
```

Use `composer require drupal/<MODULE_NAME>:dev-<BRANCH_NAME>#<COMMIT_HASH>` to add the module.

#### For the case if `composer.json` is missing in the module repository

```
    "repositories": [
        {
            "type": "package",
            "package": {
                "name": "drupal/<MODULE_NAME>",
                "version": "dev-amazee",
                "type": "drupal-module",
                "source": {
                    "type": "git",
                    "url": "git@github.com:<REPOSITORY/NAME>.git",
                    "reference": "<BRANCH-NAME>"
                }
            }
        },
        ...
    ],
```

Use `composer require drupal/<MODULE_NAME>:dev-amazee#<COMMIT_HASH>` to add the module.

#### For the case when destination path should be other than `modules/contrib/<MODULE_NAME>`

```
    "extra": {
        "installer-paths": {
            "web/modules/custom/<MODULE_NAME>": ["drupal/<MODULE_NAME>"],
            ...
        }
    }
```

### Add a JS library

Most of libraries can be added easily with composer. The tricky part is that most of Drupal modules require that libraries are saved under `libraries` directory while Composer installs them to `vendor`. The `composer/installers` can override package paths, but only for packages that depend on it. So, you'll need to write (or override) the `composer.json` file of the library stating that it has `composer/installers` dependency.

Example diff: https://gist.github.com/Leksat/d4ffca138a6608e6c00d6bf1917ee826

### Switch a dependency package to a forked version

1. Add the forked repository to the `composer.json`
1. Change the package version to the branch name prefixed with `dev-`
1. Run `composer update <package/name>` (`composer.lock` will be updated)

Example: https://github.com/AmazeeLabs/d8-starter-composer/commit/cbe1481

### Update existing Drupal 8 project to use composer

You will need:
- Move files around, setup composer stuff
  - Step by step guide: https://www.amazeelabs.com/node/1300#migrate-to-composer
  - Hepler script for git submodules: https://github.com/AmazeeLabs/scripts/blob/master/Drupal/git-submodules-to-composer-require.php
- Ask @devops to update environment(s) configuration and deloyment script as for composer-based project
- After deployment, on server(s):
  - Manually move the `sites/default/files` directory to `web/sites/default/files`
  - Manually remove all leftover derictories that should not be there anymore (like `modules`, `themes`, etc)
  - Update bash aliases, example: https://github.com/AmazeeLabs/devops/commit/e257359
