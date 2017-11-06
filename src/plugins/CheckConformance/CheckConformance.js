/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Tue Oct 31 2017 11:01:11 GMT-0500 (Central Daylight Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'plugin/PluginMessage',
    'common/util/ejs',
    'formulasrc/templates/renderCache'
], function (PluginConfig,
             pluginMetadata,
             PluginBase,
             PluginMessage,
             ejs,
             renderCache) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of CheckConformance.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin CheckConformance.
     * @constructor
     */
    var CheckConformance = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    CheckConformance.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    CheckConformance.prototype = Object.create(PluginBase.prototype);
    CheckConformance.prototype.constructor = CheckConformance;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    CheckConformance.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            activeNode = self.activeNode,
            renderPars = {},
            formulaFile = '';

        if (activeNode === null) {
            self.result.setSuccess(false);
            callback(null, self.result);
            return;
        }

        renderPars.modelName = self.core.getAttribute(activeNode, 'name');
        renderPars.metaNodes = self.core.getAllMetaNodes(activeNode);
        renderPars.core = self.core;

        for (var path in renderPars.metaNodes) {
            console.log('META-', self.core.getAttribute(renderPars.metaNodes[path], 'name'), ':', JSON.stringify(self.core.getOwnJsonMeta(renderPars.metaNodes[path]), null, 2));
        }
        formulaFile += ejs.render(renderCache.raw.s1, {});
        formulaFile += ejs.render(renderCache.raw.s2, renderPars);
        formulaFile += ejs.render(renderCache.raw.s3, renderPars);
        formulaFile += ejs.render(renderCache.raw.s4, renderPars);

        // self.result.addMessage(new PluginMessage({
        //     commitHash: self.commitHash,
        //     activeNode: self.core.getPath(activeNode),
        //     message: formulaFile
        // }));

        console.log(formulaFile);
        self.result.setSuccess(true);
        callback(null, self.result);
    };

    return CheckConformance;
});
