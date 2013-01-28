dojo.provide('gis.dijit.Growler');

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

(function(){
    var css = [dojo.moduleUrl("gis.dijit.Growler", "css/Growler.css")];
    var head = document.getElementsByTagName("head").item(0), link;
    for (var i = 0, il = css.length; i < il; i++) {
        link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = css[i].toString();
        head.appendChild(link);
    }
}());

dojo.declare('gis.dijit.Growler', [dijit._Widget, dijit._Templated], {
    templateString: '<div data-dojo-attach-point="continerNode"></div>',
    growl: function(props){
        dojo.mixin(props, {
            container: this.continerNode
        });
        new gis.dijit.Growl(props);
    }
});

dojo.declare('gis.dijit.Growl', [dijit._Widget, dijit._Templated], {
    templateString: dojo.cache('gis.dijit.Growler', 'templates/Growl.html'),
    title: "Title",
    message: "Message",
    timeout: 3000,
    opacity: 0.85,
    container: null,
    timer: null,
    postCreate: function(){
        this.inherited(arguments);
        if (this.container) {
            dojo.style(this.domNode, 'opacity', 0);
            dojo.place(this.domNode, this.container);
            dojo.anim(this.domNode, {
                opacity: this.opacity
            }, 250);
            this.setTimeout();
        }
        else {
            console.log("Growl container not found/specified.");
        }
    },
    setTimeout: function(){
        this.timer = setTimeout(dojo.hitch(this, 'close'), this.timeout);
    },
    hoverOver: function(){
        clearInterval(this.timer);
        dojo.addClass(this.domNode, 'hover');
    },
    hoverOut: function(){
        this.setTimeout();
        dojo.removeClass(this.domNode, 'hover');
    },
    close: function(){
        dojo.anim(this.domNode, {
            opacity: 0
        }, 500, null, dojo.hitch(this, 'remove'));
    },
    remove: function(){
        dojo.anim(this.domNode, {
            height: 0,
            margin: 0
        }, 250, null, dojo.partial(dojo.destroy, this.domNode));
    }
});
