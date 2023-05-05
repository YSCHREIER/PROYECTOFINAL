// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel"
], function (Controller,Filter,FilterOperator,JSONModel) {

    return Controller.extend("gestionempleados.controller.VerEmpleados", {

        onInit: function () {
            
        },

        onSelectionEmployee:function(oEvent)
        {
            let oBindingContext = oEvent.getSource().getBindingContext("odataModelZEmployees"),
                sIdEmployee = oBindingContext.getObject().EmployeeId,
                sPath = oEvent.getSource().getBindingContext("odataModelZEmployees").getPath();

                let oDetail = this.getView().byId("detailEmployee");
                oDetail.bindElement("odataModelZEmployees>"+ sPath);

                
                this.byId("splitAppEmployee").to(this.createId("detailEmployee"));

        },

        onSearchEmployee:function(oEvent)
        {

          

            let sFiltro = oEvent.getSource().getValue();
            aFilters = [];

			if (sFiltro.length > 0) {
                aFilters.push(new Filter({
                    filters:[
                        new Filter("FirstName",FilterOperator.Contains, sFiltro  ),
                        new Filter("LastName",FilterOperator.Contains, sFiltro  ),
                        new Filter("Dni",FilterOperator.Contains,sFiltro  )
                    ],
                    and :false
                 }));
			}

        
			// SE ASIGNA FILTRO AL LISTADO

			var oListEmployee = this.byId("listEmployee");
			var oBindingEmployee = oListEmployee.getBinding("items");
			oBindingEmployee.filter(aFilters);

        }


    });
}); 