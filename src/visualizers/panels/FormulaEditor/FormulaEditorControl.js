/*globals define, WebGMEGlobal*/
/*jshint browser: true*/
/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Fri May 13 2016 16:30:58 GMT-0500 (CDT).
 */

define(['js/Constants',
    'js/Utils/GMEConcepts',
    'js/NodePropertyNames',
    'plugin/GenFORMULA/GenFORMULA/utils',
    'superagent',
    'text!api/componentSettings/FormulaEditor'
], function (CONSTANTS,
             GMEConcepts,
             nodePropertyNames,
             utils,
             superagent,
             componentConfig) {

    'use strict';

    var FormulaEditorControl;

    componentConfig = JSON.parse(componentConfig || {});

    FormulaEditorControl = function (options) {
        var self = this;
        this._logger = options.logger.fork('Control');

        this._client = options.client;

        // Initialize core collections and variables
        this._widget = options.widget;

        this._currentNodeId = null;
        this._currentNodeParentId = undefined;

        this._initWidgetEventHandlers();

        // this._widget.setTitle('FormulaEditor');

        this._result = {state: null, projectId: null, commitHash: null, result: null};

        //setting up UI toward the client and the territory
        this._territoryId = this._client.addUI(self, function (events) {
            self._eventCallback(events);
        });
        this._territoryPattern = {};
        this._territoryPattern[CONSTANTS.PROJECT_ROOT_ID] = {children: 0};
        this._client.updateTerritory(this._territoryId, this._territoryPattern);

        this._logger.debug('ctor finished');
    };

    FormulaEditorControl.prototype._initWidgetEventHandlers = function () {
        var self = this;

        this._widget.onSaveConstraints = function (constraints) {
            self._client.setAttributes(CONSTANTS.PROJECT_ROOT_ID, '_formulaConstraints', constraints);
        };

        this._widget.onCheckConstraints = function (constraints) {
            self._widget.waitForResults();
            var pluginContext = self._client.getCurrentPluginContext('Export2FORMULA', CONSTANTS.PROJECT_ROOT_ID);

            // console.time('translate');
            self._client.runServerPlugin('Export2FORMULA', pluginContext, function (err, pluginResult) {
                // console.timeEnd('translate');
                if (err) {
                    self._logger.error(err);
                    self._widget.setResults({});
                    return;
                }

                pluginContext = self._client.getCurrentPluginContext('CheckFORMULA', CONSTANTS.PROJECT_ROOT_ID);

                //setting config parameters
                pluginContext.pluginConfig = {
                    formulaModule: pluginResult.artifacts[0],
                    constraints: constraints.join(" ")
                };

                // console.time('check');
                self._client.runServerPlugin('CheckFORMULA', pluginContext, function (err, pluginResult) {
                    // console.timeEnd('check');
                    if (err || pluginResult.error) {
                        self._logger.error(err || new Error(pluginResult.error));
                        self._widget.setResults({});
                    }

                    if (pluginResult.messages.length > 0) {
                        // we just put the first as a notification
                        self._client.dispatchEvent(self._client.CONSTANTS.NOTIFICATION, {
                            severity: pluginResult.messages[0].severity || 'info',
                            message: '[Formula] ' + pluginResult.messages[0].message
                        });
                        // something was still off so let's just finish the loaderCircle
                        self._widget.setResults({});
                    }
                });
            });
        };

        this._widget.onHookStateChanged = function (newSate) {
            if (newSate === 'on') {
                // We have to set the hook for the project
                self._setHook(function (err) {
                    if (err) {
                        self._logger('Failed to set hook:', err);
                        self._widget.setHookStatus('error');
                    }
                });
            } else {
                self._deleteHook(function (err) {
                    if (err) {
                        self._logger('Failed to remove hook:', err);
                        self._widget.setHookStatus('error');
                    }
                });
            }
        };
    };

    /* * * * * * * * Visualizer content update callbacks * * * * * * * */
    // One major concept here is with managing the territory. The territory
    // defines the parts of the project that the visualizer is interested in
    // (this allows the browser to then only load those relevant parts).
    FormulaEditorControl.prototype.selectedObjectChanged = function (nodeId) {
        var self = this;

        self._getCurrentHook(function (err, hook) {
            if (!err) {
                self._widget.setHookStatus('on');
            } else {
                self._widget.setHookStatus('off');
            }
        });

        // var desc = this._getObjectDescriptor(nodeId),
        //     self = this;
        //
        // self._logger.debug('activeObject nodeId \'' + nodeId + '\'');
        //
        // // Remove current territory patterns
        // if (self._currentNodeId) {
        //     self._client.removeUI(self._territoryId);
        // }
        //
        // self._currentNodeId = nodeId;
        // self._currentNodeParentId = undefined;
        //
        // if (typeof self._currentNodeId === 'string') {
        //     // Put new node's info into territory rules
        //     self._selfPatterns = {};
        //     self._selfPatterns[nodeId] = {children: 0};  // Territory "rule"
        //
        //     self._widget.setTitle(desc.name.toUpperCase());
        //
        //     if (typeof desc.parentId === 'string') {
        //         self.$btnModelHierarchyUp.show();
        //     } else {
        //         self.$btnModelHierarchyUp.hide();
        //     }
        //
        //     self._currentNodeParentId = desc.parentId;
        //
        //     self._territoryId = self._client.addUI(self, function (events) {
        //         self._eventCallback(events);
        //     });
        //
        //     // Update the territory
        //     self._client.updateTerritory(self._territoryId, self._selfPatterns);
        //
        //     self._selfPatterns[nodeId] = {children: 1};
        //     self._client.updateTerritory(self._territoryId, self._selfPatterns);
        // }
    };

    FormulaEditorControl.prototype._refreshConstraints = function () {
        this._widget.setDomain(utils.getLanguageAsString(this._client, this._client.getAllMetaNodes()));
        var node = this._client.getNode(CONSTANTS.PROJECT_ROOT_ID);

        if (node) {
            this._widget.setConstraints(node.getAttribute('_formulaConstraints') || "");
        } else {
            this._widget.setConstraints('');
        }
    };

    // FormulaEditorControl.prototype._getSimpleResults = function () {
    //     // this._widget.setResults('checking');
    //     // now we check if we have results
    //     var self = this,
    //         project = self._client.getProjectObject(),
    //         rootNode = self._client.getNode(CONSTANTS.PROJECT_ROOT_ID),
    //         formulaInfo;
    //
    //     this._widget.setResults({}); //initializing results
    //
    //     if (rootNode) {
    //         formulaInfo = rootNode.getAttribute('_formulaInfo');
    //         if (formulaInfo && typeof formulaInfo.originCommitHash === 'string' &&
    //             Object.keys(formulaInfo.simpleCheckResults || {}).length !== 0) {
    //             // we have results and a possible origin commit hash so let's check it out
    //             project.loadObject(self._client.getActiveCommitHash(), function (err, commitObj) {
    //                 if (err) {
    //                     self._logger.error(err);
    //                 } else {
    //                     if (commitObj.parents && commitObj.parents.indexOf(formulaInfo.originCommitHash) > -1 &&
    //                         commitObj.parents.length === 1) {
    //                         self._widget.setResults(formulaInfo.simpleCheckResults);
    //                     }
    //                 }
    //             });
    //         }
    //     }
    // };

    FormulaEditorControl.prototype._getSimpleResults = function () {
        var self = this,
            commitHash = self._client.getActiveCommitHash(),
            projectId = self._client.getActiveProjectId(),
            interval,
            retryCounter = 0,
            maxRetry = componentConfig.maxRetry || 10,
            waiting = false;

        self._result.state = 'collecting';
        self._result.projectId = projectId;
        self._result.commitHash = commitHash;

        self._widget.setResults({}); // TODO we should state that we are loading the results
        interval = setInterval(function () {
            if (!waiting) {
                waiting = true;
                superagent.get('4ml/' + encodeURIComponent(projectId) + '/' + encodeURIComponent(commitHash))
                    .end(function (err, result) {
                        retryCounter += 1;
                        waiting = false;
                        // First, we check if our version is still the one to show
                        if (commitHash !== self._result.commitHash || projectId !== self._result.projectId) {
                            clearInterval(interval);
                            return;
                        }

                        // Then, we check how to handle the result
                        if (err) {
                            // TODO we should state the error/retry
                            // console.log(err.message.indexOf('Internal Server Error') !== -1);

                            if (err.message.indexOf('Internal Server Error') !== -1 ||
                                err.message.indexOf('Forbidden') !== -1) {
                                //there will be no better result
                                clearInterval(interval);
                            }
                        } else {
                            result = JSON.parse(result.text).result;

                            if (result === null) {
                                // TODO we should state that the result is under computation
                            } else {
                                clearInterval(interval);
                                self._widget.setResults(result.constraints);
                            }
                        }

                        if (retryCounter >= maxRetry) {
                            clearInterval(interval);
                        }
                    });
            }
        }, 1000);
    };
    /* * * * * * * * Node Event Handling * * * * * * * */
    FormulaEditorControl.prototype._eventCallback = function (events) {
        var i = events ? events.length : 0,
            event;

        this._logger.debug('_eventCallback \'' + i + '\' items');

        while (i--) {
            event = events[i];
            switch (event.etype) {
                case CONSTANTS.TERRITORY_EVENT_LOAD:
                    this._onLoad(event.eid);
                    break;
                case CONSTANTS.TERRITORY_EVENT_UPDATE:
                    this._onUpdate(event.eid);
                    break;
                case CONSTANTS.TERRITORY_EVENT_UNLOAD:
                    this._onUnload(event.eid);
                    break;
                default:
                    break;
            }
        }

        this._logger.debug('_eventCallback \'' + events.length + '\' items - DONE');
    };

    FormulaEditorControl.prototype._onLoad = function (gmeId) {
        this._refreshConstraints();
        this._getSimpleResults();
    };

    FormulaEditorControl.prototype._onUpdate = function (gmeId) {
        this._refreshConstraints();
        this._getSimpleResults();
    };

    FormulaEditorControl.prototype._onUnload = function (gmeId) {
        this._logger.error('Project root cannot be removed!!!');
    };

    FormulaEditorControl.prototype._stateActiveObjectChanged = function (model, activeObjectId) {
        if (this._currentNodeId === activeObjectId) {
            // The same node selected as before - do not trigger
        } else {
            this.selectedObjectChanged(activeObjectId);
        }
    };

    FormulaEditorControl.prototype._getCurrentHook = function (callback) {
        var projectId = (this._client.getActiveProjectId() || "").replace('+', '/');
        superagent.get('/api/projects/' + projectId + '/hooks/FormulaMachineHook')
            .end(function (err, result) {
                if (err) {
                    result = {};
                }
                result = JSON.parse(result.text || '{}');
                callback(err, result);
            });
    };

    FormulaEditorControl.prototype._setHook = function (callback) {
        var projectId = (this._client.getActiveProjectId() || "").replace('+', '/');
        superagent.put('/api/projects/' + projectId + '/hooks/FormulaMachineHook')
            .send({
                events: [
                    'COMMIT'
                ],
                url: componentConfig.baseUrl || 'http://127.0.0.1:9009/4ml',
                description: 'Hook to external formula machine to allow automated checking.'
            })
            .end(function (err/*, result*/) {
                callback(err);
            });
    };

    FormulaEditorControl.prototype._deleteHook = function (callback) {
        var projectId = (this._client.getActiveProjectId() || "").replace('+', '/');
        superagent.delete('/api/projects/' + projectId + '/hooks/FormulaMachineHook')
            .end(function (err/*, result*/) {
                callback(err);
            });
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    FormulaEditorControl.prototype.destroy = function () {
        this._detachClientEventListeners();
        // this._removeToolbarItems();

        if (this._territoryId) {
            this._client.removeUI(this._territoryId);
            this._territoryId = null;
        }
    };

    FormulaEditorControl.prototype._attachClientEventListeners = function () {
        this._detachClientEventListeners();
        WebGMEGlobal.State.on('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged, this);
    };

    FormulaEditorControl.prototype._detachClientEventListeners = function () {
        WebGMEGlobal.State.off('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged);
    };

    FormulaEditorControl.prototype.onActivate = function () {
        this._attachClientEventListeners();
        // this._displayToolbarItems();

        if (typeof this._currentNodeId === 'string') {
            WebGMEGlobal.State.registerSuppressVisualizerFromNode(true);
            WebGMEGlobal.State.registerActiveObject(this._currentNodeId);
            WebGMEGlobal.State.registerSuppressVisualizerFromNode(false);
        }
    };

    FormulaEditorControl.prototype.onDeactivate = function () {
        this._detachClientEventListeners();
        // this._hideToolbarItems();
    };

    /* * * * * * * * * * Updating the toolbar * * * * * * * * * */
    return FormulaEditorControl;
});
