dojo.provide('gis.dijit.Draw');

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

//anonymous function to load CSS files required for this module
(function() {
    var css = [dojo.moduleUrl("gis.dijit.Draw", "css/Draw.css")];
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

// main draw dijit
dojo.declare('gis.dijit.Draw', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
    templateString: dojo.cache("gis.dijit.Draw", "templates/Draw.html"),
    drawToolbar: null,
    graphics: null,
    postCreate: function() {
        this.inherited(arguments);
        this.drawToolbar = new esri.toolbars.Draw(this.map);
        this.graphics = new esri.layers.GraphicsLayer({
            id: "drawGraphics"
        });
        this.map.addLayer(this.graphics);
        dojo.connect(this.drawToolbar, "onDrawEnd", this, 'onDrawToolbarDrawEnd');
    },
    drawPoint: function() {
		this.disconnectMapClick();
        this.drawToolbar.activate(esri.toolbars.Draw.POINT);
    },
    drawLine: function() {
		this.disconnectMapClick();
        this.drawToolbar.activate(esri.toolbars.Draw.POLYLINE);
    },
    drawPolygon: function() {
		this.disconnectMapClick();
        this.drawToolbar.activate(esri.toolbars.Draw.POLYGON);
    },
    disconnectMapClick: function(){
        dojo.disconnect(this.mapClickEventHandle);
        this.mapClickEventHandle = null;
    },
    connectMapClick: function(){
        if(this.mapClickEventHandle === null){
          this.mapClickEventHandle = dojo.connect(this.map, "onClick", this.mapClickEventListener);
        }
    },
    onDrawToolbarDrawEnd: function(geometry) {
        this.drawToolbar.deactivate();
		this.connectMapClick();
        var symbol;
        switch(geometry.type) {
        case "point":
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([255, 0, 0, 1.0]));
            break;
        case "polyline":
            symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([255, 0, 0]), 1);
            break;
        case "polygon":
            symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.0]));
            break;
        default:
        }
        var graphic = new esri.Graphic(geometry, symbol);
        this.graphics.add(graphic);
    },
    clearGraphics: function() {
        this.graphics.clear();
        this.drawToolbar.deactivate();
        this.connectMapClick();
    }
});