dojo.provide('gis.viewer.Controller');

dojo.require('gis.viewer.Modules');

dojo.declare('gis.viewer.Controller', null, {
    config: {
        item: {}
    },
    constructor: function(){
        app = this;
        this.urlObject = esri.urlToObject(document.location.href);
        this.urlObject.query = this.urlObject.query || {};
        this.loadBaseConfig();
    },
    loadBaseConfig: function(){
        dojo.xhrGet({
            url: "lib/gis/viewer/config.json",
            handleAs: "json",
            preventCache: true,
            load: dojo.hitch(this, function(response){
                dojo.mixin(this.config, response);
                this.loadAppConfig(this.config);
            }),
            error: function(err){
                console.log('Error loading base config: ', err);
            }
        });
    },
    loadAppConfig: function(config){
        esri.config.defaults.geometryService = new esri.tasks.GeometryService(config.geometryServiceURL);
        esri.config.defaults.io.proxyUrl = config.proxyPage.url;
        esri.config.defaults.io.alwaysUseProxy = config.proxyPage.alwaysUseProxy;
        esri.arcgis.utils.arcgisUrl = config.orgSharingURL;
        
        if (!this.urlObject.query.appid) {
            this.urlObject.query.appid = config.defaultappId;
        }
        var appDef = esri.arcgis.utils.getItem(this.urlObject.query.appid);
        appDef.then(dojo.hitch(this, function(item){
            dojo.mixin(this.config.item, item);
            this.initView(this.config);
        }), function(err){
            console.log('Error loading app config: ', err);
        });
    },
    initView: function(config){
        dojo.doc.title = config.item.item.title;
        dojo.byId('title').innerHTML = config.item.item.title;
        dojo.byId('subtitle').innerHTML = config.item.itemData.values.subtitle;
        
        var outer = new dijit.layout.BorderContainer({
            id: "borderContainer",
            design: "headline",
            liveSplitters: false
        }).placeAt(dojo.body());
        
        var left = new dijit.layout.ContentPane({
            region: 'left',
            id: 'left',
            splitter: true,
            content: dojo.replace(dojo.cache("gis.viewer", "templates/left.html"), config.item.itemData)
        }).placeAt(outer);
        
        var map = new dijit.layout.ContentPane({
            region: 'center',
            id: 'map',
            content: dojo.replace(dojo.cache("gis.viewer", "templates/mapOverlay.html"), config.item.itemData)
        }).placeAt(outer);
        
        outer.startup();
        this.initMap(config);
    },
    
    initMap: function(config){
        var mapDeferred = esri.arcgis.utils.createMap(config.item.itemData.values.webmap, "map", {
            mapOptions: {
                slider: true,
                nav: false,
                wrapAround180: true
            },
            ignorePopups: false
        });
        
        mapDeferred.then(dojo.hitch(this, function(response){
            this.webMap = response;
            this.map = response.map;
            this.mapClickEventHandle = response.clickEventHandle;
            this.mapClickEventListener = response.clickEventListener;
            
            dojo.connect(dijit.byId('map'), 'resize', this.map, 'resize');
            this.initWidgets();
        }));
        
        mapDeferred.addErrback(function(error){
            console.log("CreateMap failed: ", dojo.toJson(error));
        });
    },
    initWidgets: function(){
        this.growler = new gis.dijit.Growler({}, "growlerWidget");
        this.growler.startup();
        
        this.printWidget = new gis.dijit.Print({
            map: this.map,
            printTaskURL: this.config.printTaskURL,
            authorText: this.config.item.itemData.values.authorText,
            copyrightText: this.config.item.itemData.values.copyrightText
        }, 'printWidget');
        this.printWidget.startup();
        
        this.drawWidget = new gis.dijit.Draw({
            map: this.map,
            mapClickEventHandle: this.mapClickEventHandle,
            mapClickEventListener: this.mapClickEventListener
        }, 'redlineWidget');
        this.drawWidget.startup();
        
        this.geoLocation = new gis.dijit.GeoLocation({
            map: this.map,
            growler: this.growler
        }, "geoLocationWidget");
        this.geoLocation.startup();
    }
});
