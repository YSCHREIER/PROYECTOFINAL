// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {

    return Controller.extend("gestionempleados.controller.Menu", {

        onInit: function () {

            
        },

            
         


        NavToCrearEmpleados: function(oEvent){

            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("crear_empleado");

        },

        NavToVerEmpleados: function(oEvent){

            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ver_empleados");

        },

        NavToPedidos: function(oEvent){

            var URL = "https://2d97ae28trial-dev-class7-approuter.cfapps.us10-001.hana.ondemand.com";
            window.open(URL);

        },


    });
}); 