<?php

/**
 * @file
 * Contains \AmazeeIO\composer\ScriptHandler.
 */

namespace AmazeeIO\composer;

use Composer\Script\Event;

class ScriptHandler {

  public static function init(Event $event) {
    static::configureLocalEnvironment($event);
  }

  public static function configureLocalEnvironment(Event $event) {
    $root = getcwd();
    $handle = fopen ("php://stdin","r");

    $event->getIO()->write('*****************************************
***** amazee.io Local Docker Config *****
*****************************************');

    $event->getIO()->write('What is the sitegroup (e.g., awesome-new-project_com)?');
    $site_name = trim(fgets($handle));

    static::replaceInFile('d8-starter_composer_io', $site_name, $root . '/config/sync/system.site.yml');
    static::replaceInFile('d8-starter_io_composer', $site_name, $root . '/.amazeeio.yml');

    $event->getIO()->write('What is the hostname (e.g., new-project.com.docker.amazee.io)?');
    $hostname = trim(fgets($handle));

    static::replaceInFile('d8-starter-composer.io.docker.amazee.io', $hostname, $root . '/docker-compose.yml');
  }

  public static function replaceInFile($needle, $haystack, $file) {
    $content = file_get_contents($file);
    $replaced = str_replace($needle, $haystack, $content);
    file_put_contents($file, $replaced);
  }

}
