dojo.provide('gis.dijit.GeoLocation');

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.Button");

dojo.declare("gis.dijit.GeoLocation", [dijit._Widget, dijit._Templated], {
    templateString: dojo.cache("gis.dijit.GeoLocation", "templates/GeoLocation.html"),
    widgetsInTemplate: true,
    postCreate: function(){
        this.inherited(arguments);
        this.symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 12, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([210, 105, 30, 0.5]), 8), new dojo.Color([210, 105, 30, 0.9]));
        this.graphics = new esri.layers.GraphicsLayer();
        this.map.addLayer(this.graphics);
    },
    geoLocate: function(){
        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(dojo.hitch(this, 'locationSuccess'), dojo.hitch(this, 'locationError'));
        }
        else {
            if (this.growler) {
                this.growler.growl({
                    title: "Error",
                    message: "Geolocation not supported by your browser."
                });
            }
            else {
                alert("Geolocation not supported by your browser.");
            }
        }
    },
    locationSuccess: function(event){
        this.graphics.clear();
        var point = esri.geometry.Point(event.coords.longitude, event.coords.latitude, new esri.SpatialReference({
            wkid: 4326
        }));
        var wmPoint = esri.geometry.geographicToWebMercator(point);
        this.map.centerAndZoom(wmPoint, 15);
        this.addGraphic(wmPoint);
        if (this.growler) {
            this.growler.growl({
                title: "Position Information",
                message: "<pre>" + dojo.toJson(dojo.clone(event.coords), true) + "</pre>"
            });
        }
    },
    locationError: function(error){
        if (this.growler) {
            this.growler.growl({
                title: "Error",
                message: "There was a problem with getting your location: " + error.message
            });
        }
        else {
            alert("There was a problem with getting your location: " + error.message);
        }
    },
    addGraphic: function(geometry){
        graphic = new esri.Graphic(geometry, this.symbol);
        this.graphics.add(graphic);
    }
});
