dojo.provide("gis.dijit.Print");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.Form");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dojox.form.BusyButton");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.ProgressBar");
dojo.require("dijit.form.DropDownButton");
dojo.require("dijit.TooltipDialog");
dojo.require("esri.tasks.PrintTask");
dojo.require("dojo.data.ObjectStore");
dojo.require("dojo.store.Memory");

//anonymous function to load CSS files required for this module
(function() {
    var css = [dojo.moduleUrl("gis.dijit.Print", "css/Print.css")];
    var head = document.getElementsByTagName("head").item(0),
        link;
    for(var i = 0, il = css.length; i < il; i++) {
        link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = css[i].toString();
        head.appendChild(link);
    }
}());

// Main print dijit
dojo.declare("gis.dijit.Print", [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templateString: dojo.cache("gis.dijit.Print", "templates/Print.html"),
    map: null,
    count: 1,
    results: [],
    baseClass: "gis_PrintDijit",
    pdfIcon: dojo.moduleUrl("gis.dijit.Print", "images/pdf.png"),
    imageIcon: dojo.moduleUrl("gis.dijit.Print", "images/image.png"),
    printTaskURL: null,
    printTask: null,
    postCreate: function() {
        this.inherited(arguments);
        this.printTask = new esri.tasks.PrintTask(this.printTaskURL);
        this.printparams = new esri.tasks.PrintParameters();
        this.printparams.map = this.map;
        this.printparams.outSpatialReference = this.map.spatialReference;

        esri.request({
            url: this.printTaskURL,
            content: {
                f: "json"
            },
            handleAs: "json",
            callbackParamName: 'callback',
            load: dojo.hitch(this, '_handlePrintInfo'),
            error: dojo.hitch(this, '_handleError')
        });
    },
    _handleError: function(err) {
        console.log(1, err);
    },
    _handlePrintInfo: function(data) {
        var Layout_Template = dojo.filter(data.parameters, function(param, idx) {
            return param.name === "Layout_Template";
        });
        if(Layout_Template.length === 0) {
            console.log("print service parameters name for templates must be \"Layout_Template\"");
            return;
        }
        var layoutItems = dojo.map(Layout_Template[0].choiceList, function(item, i) {
            return {
                name: item,
                id: item
            };
        });
        layoutItems.sort(function(a, b) {
            return(a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
        });
        var layout = new dojo.data.ObjectStore({
            objectStore: new dojo.store.Memory({
                data: {
                    identifier: 'id',
                    label: 'name',
                    items: layoutItems
                }
            })
        });
        this.layoutDijit.set('store', layout);


        var Format = dojo.filter(data.parameters, function(param, idx) {
            return param.name === "Format";
        });
        if(Format.length === 0) {
            console.log("print service parameters name for format must be \"Format\"");
            return;
        }
        var formatItems = dojo.map(Format[0].choiceList, function(item, i) {
            return {
                name: item,
                id: item
            };
        });
        formatItems.sort(function(a, b) {
            return(a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
        });
        var format = new dojo.data.ObjectStore({
            objectStore: new dojo.store.Memory({
                data: {
                    identifier: 'id',
                    label: 'name',
                    items: formatItems
                }
            })
        });
        this.formatDijit.set('store', format);
    },
    print: function() {
        if(this.printSettingsFormDijit.isValid()) {
            var form = this.printSettingsFormDijit.get('value');
            var preserve = this.preserveFormDijit.get('value');
            dojo.mixin(form, preserve);
            var layoutForm = this.layoutFormDijit.get('value');
            var mapQualityForm = this.mapQualityFormDijit.get('value');
            var mapOnlyForm = this.mapOnlyFormDijit.get('value');
            dojo.mixin(mapOnlyForm, mapQualityForm);

            var template = new esri.tasks.PrintTemplate();
            template.format = form.format;
            template.layout = form.layout;
            template.preserveScale = dojo.eval(form.preserveScale);
            template.label = form.title;
            template.exportOptions = mapOnlyForm;
            template.layoutOptions = {
                authorText: this.authorText,
                copyrightText: this.copyrightText,
                legendLayers: (layoutForm.legend.length > 0 && layoutForm.legend[0]) ? null : [],
                titleText: form.title,
                scalebarUnit: layoutForm.scalebarUnit
            };
            this.printparams.template = template;
            var fileHandel = this.printTask.execute(this.printparams);

            var result = new gis.dijit.PrintResult({
                count: this.count.toString(),
                icon: (form.format === "PDF") ? this.pdfIcon : this.imageIcon,
                docName: form.title,
                title: form.format + ', ' + form.layout,
                fileHandle: fileHandel
            }).placeAt(this.printResultsNode, 'last');
            result.startup();
            dojo.style(this.clearActionBarNode, 'display', 'block');
            this.count++;
        } else {
            this.printSettingsFormDijit.validate();
        }
    },
    clearResults: function() {
        dojo.empty(this.printResultsNode);
        dojo.style(this.clearActionBarNode, 'display', 'none');
        this.count = 1;
    }
});

// Print result dijit
dojo.declare("gis.dijit.PrintResult", [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templateString: dojo.cache("gis.dijit.Print", "templates/PrintResult.html"),
    url: null,
    postCreate: function() {
        this.inherited(arguments);
        this.fileHandle.then(dojo.hitch(this, '_onPrintComplete'), dojo.hitch(this, '_onPrintError'));
    },
    _onPrintComplete: function(data) {
        if(data.url) {
            this.url = data.url;
            this.nameNode.innerHTML = '<span class="bold">' + this.docName + '</span>';
            dojo.addClass(this.resultNode, "printResultHover");
        } else {
            this._onPrintError('Error, try again');
        }
    },
    _onPrintError: function(err) {
        console.log(err);
        this.nameNode.innerHTML = '<span class="bold">Error, try again</span>';
        dojo.addClass(this.resultNode, "printResultError");
    },
    _openPrint: function() {
        if(this.url !== null) {
            window.open(this.url);
        }
    }
});