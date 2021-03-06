/*global process,require,define*/
(function() {
    var app_layers = ['main', 'run', 'dmConfig', 'util/dom-utils'],
        dmConfig = '../../public/app/dmConfig',
        script = '';

    define = function(dmConfig) {
        var module, modules, mid, mids = {};
        modules = dmConfig.modules;
        for (module in modules) {
            if (modules.hasOwnProperty(module)) {
                mid = modules[module].moduleId;
                if (mid && !mids[mid]) {
                    script += 'profile.layers["' + mid + '"] = {};\n';
                    mids[mid] = true;
                }
            }
        }
    };
    require(dmConfig);

    script += 'profile.layers["dojo/dojo"].include.push(';
    script += app_layers.map(function(layer) {
        return '"app/' + layer + '"';
    }).join(', ');
    script += ');';

    console.log(script);

}());
