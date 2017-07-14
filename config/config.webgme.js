// DO NOT EDIT THIS FILE
// This file is automatically generated from the webgme-setup-tool.
'use strict';


var config = require('webgme/config/config.default'),
    validateConfig = require('webgme/config/validator');

// The paths can be loaded from the webgme-setup.json
config.plugin.basePaths.push(__dirname + '/../src/plugins');
config.visualization.decoratorPaths.push(__dirname + '/../node_modules/webgme-finite-state-machine/src/decorators');
config.seedProjects.basePaths.push(__dirname + '/../src/seeds/4mlEmpty');
config.seedProjects.basePaths.push(__dirname + '/../src/seeds/gemoc17');



config.visualization.panelPaths.push(__dirname + '/../src/visualizers/panels');


config.rest.components['4ml'] = __dirname + '/../src/routers/4ml/4ml.js';

// Visualizer descriptors
config.visualization.visualizerDescriptors.push(__dirname + '/../src/visualizers/Visualizers.json');
// Add requirejs paths
config.requirejsPaths = {
  'UMLStateMachineDecorator': 'node_modules\webgme-finite-state-machine\src\decorators\UMLStateMachineDecorator',
  'panels': './src/visualizers/panels',
  'widgets': './src/visualizers/widgets'
};


config.mongo.uri = 'mongodb://127.0.0.1:27017/formula';
validateConfig(config);
module.exports = config;
