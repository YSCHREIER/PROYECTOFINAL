// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller,Filter,FilterOperator,JSONModel,MessageBox) {

    return Controller.extend("gestionempleados.controller.VerEmpleados", {

        onInit: function () {
            
            this.sIdEmployee="";
            this.sSapId="";
            this.sPath="";

          


        },


        onSaveSalary: function(){

            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle(),                
            oController = this;

            var oModelSalary = this.pDialog.getModel("newSalary");
		    
		    var odataSalary = oModelSalary.getData();
        
                 odataSalary = {
                    EmployeeId : this.sIdEmployee,
                    SapId : this.sSapId,
                    CreationDate : odataSalary.CreationDate,
                    Amount : odataSalary.Amount,
                    Comments : odataSalary.Comments
                              
                };

                let sUrl = "/Salaries"; //NOMBRE DE LA ENTIDAD

             
                this.getView().getModel("odataModelZEmployees").create(sUrl,odataSalary,{
                        success: function(data){      
                                                    
                            MessageBox.success(oResourceBundle.getText("lblPopUpOk"), {
                                actions: [MessageBox.Action.OK],
                                onClose: function (oAction) {
                                    if (oAction === MessageBox.Action.OK) {
                                        
                                        oController.onCloseDialog();
                                     
                                    }
                                }.bind(oController)
                            });

                        }.bind(this),
                        error : function(){
                          
                            sap.m.MessageToast.show(oResourceBundle.getText("lblPopUpNOk"));
                        }.bind(this)

                });                  


        },

        onOpenDialog: function(oEvent)
            {
                
                if(!this.pDialog){
                    this.pDialog = sap.ui.xmlfragment("gestionempleados.fragment.DialogSalary",this);
                    this.getView().addDependent(this.pDialog);                
                }

                this.pDialog.setModel(new sap.ui.model.json.JSONModel({}),"newSalary");

                this.pDialog.open();

            },

            onCloseDialog: function()
            {
                this.pDialog.close();
            },


        onSelectionEmployee:function(oEvent)
        {
            let oBindingContext = oEvent.getSource().getBindingContext("odataModelZEmployees"),
                sIdEmployee = oBindingContext.getObject().EmployeeId,
                sSAPID=oBindingContext.getObject().SapId,
                sPath = oEvent.getSource().getBindingContext("odataModelZEmployees").getPath();

                this.sIdEmployee=sIdEmployee;
                this.sSAPID = sSAPID;
                this.sPath = sPath;

                let oDetail = this.getView().byId("detailEmployee");
                oDetail.bindElement("odataModelZEmployees>"+ sPath);
                
                this.byId("splitAppEmployee").to(this.createId("detailEmployee"));

        },

        onDeleteEmployee : function(){

            var that = this;
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
           
            
           let sUrl = "/Users(EmployeeId='"+ this.sIdEmployee + "',SapId='"+this.sSAPID+"')"; 
                      
            MessageBox.confirm(oResourceBundle.getText("deleteConfirm"), {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						
                       
                        this.getView().getModel("odataModelZEmployees").remove(sUrl,{
                            success: function(){
                                
                                sap.m.MessageToast.show(oResourceBundle.getText("oDataDeleteOK"));
                                this.byId("splitAppEmployee").to(this.createId("detailSelectEmployee"));

                            }.bind(this),
                            error : function(){
                                sap.m.MessageToast.show(oResourceBundle.getText("oDataDeleteNOK"));
                            }.bind(this)
        
                    });
                       
					}
				}.bind(this)
			});

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

        },

        onFileUploadComplete : function (oEvent) {

            var oUploadCollection = oEvent.getSource();
            oUploadCollection.getBinding("items").refresh();

        },

        onFileUpload: function (oEvent) {
            

            let Token = this.getView().getModel("odataModelZEmployees").getSecurityToken(),
            sSAPID = this.sSAPID,
             oUploadSet = this.byId("uploadCollection"),
             sEmployeeId = this.sIdEmployee;

             oUploadSet.getItems().forEach(function (oItem) {
                 if (oItem.getListItem().getSelected()) {
               

                    let  sFileName = oItem.getFileName(),
                    sLug = sSAPID + ";" +  sEmployeeId + ";" + sFileName;
            
             

            // Header Token CSRF - Cross-site request forgery
            let oCustomerHeaderToken = new sap.ui.core.Item({
                key: "X-CSRF-Token",
                text:Token
            });

            oItem.addHeaderField(oCustomerHeaderToken);

            let oCustomerText = new sap.ui.core.Item({
                key:"Slug",
                text:sLug
            });

            oItem.addHeaderField(oCustomerText)

            oItem.setUploadState("Ready");
            oUploadSet.setUploadUrl("/gestionempleados/sap/opu/odata/sap/ZEMPLOYEES_SRV/Attachments");
            oUploadSet.uploadItem(oItem);
              
        }

    });

   
    

        },

        
        onFileDeleted: function (oEvent) {
            var oUploadCollection = oEvent.getSource();
            var sPath = oEvent.getParameter("item").getBindingContext("odataModelZEmployees").getPath();
            this.getView().getModel("odataModelZEmployees").remove(sPath, {
                success: function () {
                    oUploadCollection.getBinding("items").refresh();
                },
                error: function () {

                }
            });
        },

        downloadFile : function(oEvent) {

            let oItem = oEvent.getSource(),
                oBindingContext = oItem.getBindingContext("odataModelZEmployees"),
                sPath = oBindingContext.getPath(),
                sUrl = "/sap/opu/odata/sap/ZEMPLOYEES_SRV/"+sPath+"/$value"
          
                oItem.setUrl(sUrl);


        }


    });
}); 