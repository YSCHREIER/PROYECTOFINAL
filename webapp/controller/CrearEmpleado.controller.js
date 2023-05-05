// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
	"sap/m/MessageBox",
    "sap/m/UploadCollectionParameter",
    "sap/ui/core/routing/History",
], function (Controller,JSONModel,MessageToast,MessageBox,UploadCollectionParameter,History) {

    return Controller.extend("gestionempleados.controller.CrearEmpleado", {

      
        onInit: function () {

            //97444090J

            //SE DECLARA MODELO Y VARIABLES DEL WIZARD A UTILIZAR

            this.oWizard = this.byId("CreateEmployee");
			this.oNavContainer = this.byId("wizardNavContainer");
			this.oWizardContentPage = this.byId("wizardContentPage");

            this.EmployeeID = "";

            let oModelConfig = new JSONModel(),
                oModelEmployee = new JSONModel(),
                oView = this.getView();

            oModelConfig.loadData("model/Config.json");           
            oView.setModel(oModelConfig,"jsonConfig");

			oModelEmployee.setData({
				StateNombre: "Error",
                StateApellido: "Error",
                StateFecha: "Error",
                StateDNI: "Error",
                StateCIF: "Error",
                TipoEmpleado:"",
                GlosaTipoEmpleado:"",
                Nombre:"",
                Apellido:"",
                DNI:"",                          
                CIF:"",                       
                SaldoBrutoAnual:24000,                  
                PrecioDiario:400,               
                FechaIncorporacion:null,
                Comentarios:"",     
                navApiEnabled:false

			});
			oView.setModel(oModelEmployee,"jsonEmployee");
			


        },

        onAdditionalInformationActivate: function () {

            let oModelEmployee = this.getView().getModel("jsonEmployee");
            oModelEmployee.setProperty("/navApiEnabled", true);
		
		},

		onAdditionalInformationComplete: function () {

            let oModelEmployee = this.getView().getModel("jsonEmployee");
            oModelEmployee.setProperty("/navApiEnabled", false);
		},

        onWizardCompletedHandler: function () {
            //SE TERMINARON LOS PASOS AHORA IR A REVISAR EL CONTENIDO

            //Se obtiene los archivos subidos
				var uploadCollection = this.byId("uploadCollection");
				var files = uploadCollection.getItems();
				var numFiles = uploadCollection.getItems().length;
                let oModelEmployee = this.getView().getModel("jsonEmployee");
				
                oModelEmployee.setProperty("/CantidadArchivos",numFiles);

                
				if (numFiles > 0) {
					var arrayFiles = [];
					for(var i in files){
						arrayFiles.push({DocName:files[i].getFileName(),MimeType:files[i]._oFileObject.type});	
					}
					oModelEmployee.setProperty("/files",arrayFiles);
				}else{
					oModelEmployee.setProperty("/files",[]);
				}

			this.oNavContainer.to(this.byId("wizardReviewPage"));
		},

        setDataEmployeeSegmented: function(oEvent){
        	
            this.oWizard.validateStep(this.byId("DataEmployeeStep"));

        },

        onReadODataEmployee : function(){

            let sUrl = "/Users",//NOMBRE DE LA ENTIDAD
                oController = this;
            var that = this;
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
        
            this.getOwnerComponent().getModel("odataModelZEmployees").read(sUrl,{
                filters : [
                    new sap.ui.model.Filter("SapId","EQ",oController.getOwnerComponent().SapId)
                ],
                success : function(data){

                    console.log(data.results);

                    var IDEmployee = data.results[data.results.length - 1].EmployeeId;
                    

                    console.log(IDEmployee);

                    that.onSaveFilesSAP(IDEmployee);
                   
                    


                },
                error : function(e){
                    
                }

            })

        },

        onSaveFilesSAP: function (IDEmployee) {

            let uploadCollection = this.byId("uploadCollection"),
                oItemCollection = uploadCollection.getItems(),
                Token = this.getView().getModel("odataModelZEmployees").getSecurityToken(),
                SapId = this.getOwnerComponent().SapId;

                // SE RECORRE CADA ITEM DEL OBJETO UPLOAD COLLECTION , SE ASIGNA TOKEN Y SLUG Y SE SUBE A SAP

            oItemCollection.forEach((oItem)=>{
                   
                let sFileName = oItem.getFileName(),
                    sLug = SapId + ";" + IDEmployee + ";" + sFileName;

                let oCustomerHeaderToken = new sap.ui.core.Item({
                        key: "X-CSRF-Token",
                        text:Token
                    });

                    let oCustomerText = new sap.ui.core.Item({
                        key:"Slug",
                        text: sLug
                    });

                    oItem.addHeaderField(oCustomerHeaderToken);
                    oItem.addHeaderField(oCustomerText);

                    oItem.setUploadState("Ready");
                    uploadCollection.setUploadUrl("/gestionempleados/sap/opu/odata/sap/ZEMPLOYEES_SRV/Attachments");
                    
                    uploadCollection.uploadItem(oItem);



            });
            

        },


        onSaveEmployee : function()
        {

            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle(),                
                oEmployeeModel = this.getView().getModel("jsonEmployee").getData(),
                oController = this;
            
            var sEmployeeId="0";

                   
                    let oData = {
                        SapId : this.getOwnerComponent().SapId,
                        Type : (oEmployeeModel.TipoEmpleado=="I"?"0" : oEmployeeModel.TipoEmpleado=="A"? "1" :"2") ,
                        FirstName:oEmployeeModel.Nombre,
                        LastName:oEmployeeModel.Apellido,                       
                        Dni:(oEmployeeModel.TipoEmpleado=="A"? oEmployeeModel.CIF: oEmployeeModel.DNI),
                        CreationDate :  oEmployeeModel.FechaIncorporacion,
                        Comments :   oEmployeeModel.Comentarios                    
                    };

                    oData.UserToSalary = [{
                        Amount : parseFloat((oEmployeeModel.TipoEmpleado=="A"? oEmployeeModel.PrecioDiario: oEmployeeModel.SaldoBrutoAnual)).toString(),
                        Comments : oEmployeeModel.Comentarios,
                        Waers : "EUR"
                    }];

                    console.log(oData);

                    let sUrl = "/Users"; //NOMBRE DE LA ENTIDAD

                    this.getView().setBusy(true);
                    this.getView().getModel("odataModelZEmployees").create(sUrl,oData,{
                            success: function(data){      

                                this.getView().setBusy(false);
                                                        
                                oController.onReadODataEmployee.bind(oController)();

                                MessageBox.success(oResourceBundle.getText("MessageSaveOk"), {
                                    actions: [MessageBox.Action.OK],
                                    onClose: function (oAction) {
                                        if (oAction === MessageBox.Action.OK) {
                                            
                                            let oHistory = History.getInstance(),
                                            sPreviosHash = oHistory.getPreviousHash();
                                          
                                            
                                        if(sPreviosHash !== 'undefined')
                                        {
                                            window.history.go(-1);
                                        }else
                                        {
                                            let oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
                                            oRouter.navTo("menu",true);
                                        }
                    
                                        let oModelEmployee = oController.getView().getModel("jsonEmployee");
                                            oData = oModelEmployee.getData();
                                            oData.StateNombre =  "Error";
                                            oData.StateApellido="Error";
                                            oData.StateFecha= "Error";
                                            oData.StateDNI= "Error";
                                            oData.StateCIF= "Error";
                                            oData.TipoEmpleado="";
                                            oData.GlosaTipoEmpleado="";
                                            oData.Nombre="";    
                                            oData.Apellido="";
                                            oData.DNI="";                          
                                            oData.CIF="";                       
                                            oData.SaldoBrutoAnual=0;                  
                                            oData.PrecioDiario=0;               
                                            oData.FechaIncorporacion=null;
                                            oData.Comentarios="";     
                                            oData.navApiEnabled=false;
                                        
                                            oController.onHandleNavigationToStep(0);
                                            oController.oWizard.discardProgress(oController.byId("EmployeeTypeStep"));
                                            oController.oWizard.invalidateStep(oController.byId("EmployeeTypeStep"));
                    
                                        }
                                    }.bind(oController)
                                });

                               // sap.m.MessageToast.show(oResourceBundle.getText("MessageSaveOk"));
                            }.bind(this),
                            error : function(){
                                this.getView().setBusy(false);
                                sap.m.MessageToast.show(oResourceBundle.getText("MessageSaveNOk"));
                            }.bind(this)

                    });                    
        },
        
        onDataEmployeeValidation:function(oEvent){

            // VALIDA QUE LOS CAMPOS REQUERIDOS ESTEN COMPLETOS

            let oModelEmployee = this.getView().getModel("jsonEmployee"),
                oDataEmployee = oModelEmployee.getData(),
                sNombre = this.byId("inputName").getValue().trim(),
                sApellido = this.byId("inputApellido").getValue().trim(),
                sDNI = this.byId("inputDNI").getValue().trim(),
                sCIF = this.byId("inputCIF").getValue().trim(),
                sFecha = this.byId("dateFechaIncorporacion").getValue();
                
                if (sNombre === "") {
                    this.oWizard.setCurrentStep(this.byId("DataEmployeeStep"));
                    oModelEmployee.setProperty("/StateNombre", "Error");
                } else {
                    oModelEmployee.setProperty("/StateNombre", "None");
                }

                if (sApellido === "") {
                    this.oWizard.setCurrentStep(this.byId("DataEmployeeStep"));
                    oModelEmployee.setProperty("/StateApellido", "Error");
                } else {
                    oModelEmployee.setProperty("/StateApellido", "None");
                }

                if (sFecha === "") {
                    this.oWizard.setCurrentStep(this.byId("DataEmployeeStep"));
                    oModelEmployee.setProperty("/StateFecha", "Error");
                } else {
                    oModelEmployee.setProperty("/StateFecha", "None");
                }

                if (sDNI === "" && this.byId("lblDNI").getRequired()) {
                    this.oWizard.setCurrentStep(this.byId("DataEmployeeStep"));
                    oModelEmployee.setProperty("/StateDNI", "Error");
                } else {
                    oModelEmployee.setProperty("/StateDNI", "None");
                }

                if (sCIF === "" && this.byId("lblCIF").getRequired()) {
                    this.oWizard.setCurrentStep(this.byId("DataEmployeeStep"));
                    oModelEmployee.setProperty("/StateCIF", "Error");
                } else {
                    oModelEmployee.setProperty("/StateCIF", "None");
                }
                

			if (sNombre === "" || 
                sApellido === "" || 
                sFecha === "" || 
                (sDNI==="" && this.byId("lblDNI").getRequired()) ||
                (sCIF==="" && this.byId("lblCIF").getRequired())
                ) {
				this.oWizard.invalidateStep(this.byId("DataEmployeeStep"));
			} else {
				this.oWizard.validateStep(this.byId("DataEmployeeStep"));
			}

        },
        onPressInterno: function(oEvent){

            // DEPENDIENDO DEL TIPO DE EMPLEADO SE ASIGNAN VALORES AL MODELO

            let oModelEmployee = this.getView().getModel("jsonEmployee"),
                oModelConfig = this.getView().getModel("jsonConfig"),
                sValorDefault =  oModelConfig.getData().SaldoBrutoAnualDefaultInterno;

            oModelEmployee.setProperty("/TipoEmpleado", "I");
            oModelEmployee.setProperty("/GlosaTipoEmpleado", "INTERNO");

            oModelEmployee.setProperty("/CIF", "");
            oModelEmployee.setProperty("/PrecioDiario", "");
            oModelEmployee.setProperty("/SaldoBrutoAnual", sValorDefault);

            this.oWizard.validateStep(this.byId("EmployeeTypeStep"));
            

        },

        onEditEmployeeTipe:function(){
            this.onHandleNavigationToStep(0);
        },

        onEditDataEmployee:function(){
            this.onHandleNavigationToStep(1);
        },

        onEditAdditionalInformation:function(){
            this.onHandleNavigationToStep(2);
        },

        backToWizardContent: function () {
			this.oNavContainer.backToPage(this.oWizardContentPage.getId());
		},

        onWizardCancel: function () {

            // SI EL USUARIO CANCELA, SE LIMPIA MODELO, VUELVE AL PASI 1 Y REGRESA AL MENU PRINCIPAL

            var that = this;
            let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            MessageBox.confirm(oResourceBundle.getText("cancelConfirm"), {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						
                        let oHistory = History.getInstance(),
                        sPreviosHash = oHistory.getPreviousHash();
                      
                        
                    if(sPreviosHash !== 'undefined')
                    {
                        window.history.go(-1);
                    }else
                    {
                        let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("menu",true);
                    }

                    let oModelEmployee = this.getView().getModel("jsonEmployee");
            oData = oModelEmployee.getData();
            oData.StateNombre =  "Error";
            oData.StateApellido="Error";
            oData.StateFecha= "Error";
            oData.StateDNI= "Error";
            oData.StateCIF= "Error";
            oData.TipoEmpleado="";
            oData.GlosaTipoEmpleado="";
            oData.Nombre="";
            oData.Apellido="";
            oData.DNI="";                          
            oData.CIF="";                       
            oData.SaldoBrutoAnual=0;                  
            oData.PrecioDiario=0;               
            oData.FechaIncorporacion=null;
            oData.Comentarios="";     
            oData.navApiEnabled=false;
                    that.onHandleNavigationToStep(0);
                    this.oWizard.discardProgress(this.byId("EmployeeTypeStep"));
                    this.oWizard.invalidateStep(this.byId("EmployeeTypeStep"));

					}
				}.bind(this)
			});
        },

        onHandleNavigationToStep: function (iStepNumber) {
			var fnAfterNavigate = function () {
				this.oWizard.goToStep(this.oWizard.getSteps()[iStepNumber]);
				this.oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

			this.oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},

        onPressAutonomo: function(oEvent){

            // DEPENDIENDO DEL TIPO DE EMPLEADO SE ASIGNAN VALORES AL MODELO
            
            let oModelEmployee = this.getView().getModel("jsonEmployee"),
                oModelConfig = this.getView().getModel("jsonConfig"),
                sValorDefault =  oModelConfig.getData().PrecioDefault;

            oModelEmployee.setProperty("/TipoEmpleado", "A");
            oModelEmployee.setProperty("/GlosaTipoEmpleado", "AUTONOMO");
            oModelEmployee.setProperty("/DNI", "");
            oModelEmployee.setProperty("/SaldoBrutoAnual", "");
            oModelEmployee.setProperty("/PrecioDiario", sValorDefault);

            this.oWizard.validateStep(this.byId("EmployeeTypeStep"));

        },
        onPressGerente: function(oEvent){
            
            // DEPENDIENDO DEL TIPO DE EMPLEADO SE ASIGNAN VALORES AL MODELO
            
            let oModelEmployee = this.getView().getModel("jsonEmployee"),
                oModelConfig = this.getView().getModel("jsonConfig"),
                sValorDefault =  oModelConfig.getData().SaldoBrutoAnualDefaultGerente;

            oModelEmployee.setProperty("/TipoEmpleado", "G");
            oModelEmployee.setProperty("/GlosaTipoEmpleado", "GERENTE");
            oModelEmployee.setProperty("/CIF", "");
            oModelEmployee.setProperty("/PrecioDiario", "");
            oModelEmployee.setProperty("/SaldoBrutoAnual", sValorDefault);

            this.oWizard.validateStep(this.byId("EmployeeTypeStep"));

        },


        onFileChange: function (oEvent) {
            
            var oUploadCollection = oEvent.getSource();
	        
            // Header Token
	        
            var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
	        name: "x-csrf-token",
	        value: this.getView().getModel("odataModelZEmployees").getSecurityToken()
	        });
	        oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

        },

        onFileBeforeUpload: function (oEvent) {

            let oItem = oEvent.getParameter("item");
            let fileName = oItem.getFileName();
           

            // Header Token CSRF - Cross-site request forgery
            let oCustomerHeaderToken = new sap.ui.core.Item({
                key: "X-CSRF-Token",
                text:this.getView().getModel("odataModelZEmployees").getSecurityToken()
            });

            console.log(this.getView().getModel("odataModelZEmployees").getSecurityToken());

            oItem.addHeaderField(oCustomerHeaderToken);

            let oCustomerText = new sap.ui.core.Item({
                key:"Slug",
                text: this.getOwnerComponent().SapId + ";" + this.EmployeeID + ";" + fileName
            });

            oItem.addHeaderField(oCustomerText)

        },

        onFileUploadComplete: function (oEvent) {
            
            //oEvent.getSource().getBinding("items").refresh();
        },

        
        onValidateDNI: function(oEvent){

            let oModelEmployee = this.getView().getModel("jsonEmployee");
            var dni = oEvent.getParameter("value");
            var number;
            var letter;
            var letterList;
            var regularExp = /^\d{8}[a-zA-Z]$/;
            //Se comprueba que el formato es válido
            if(regularExp.test (dni) === true){
            //Número
            number = dni.substr(0,dni.length-1);
            //Letra
            letter = dni.substr(dni.length-1,1);
            number = number % 23;
            letterList="TRWAGMYFPDXBNJZSQVHLCKET";
            letterList=letterList.substring(number,number+1);
            if (letterList !== letter.toUpperCase()) {
                oModelEmployee.setProperty("/StateDNI", "Error");
            }else{
                oModelEmployee.setProperty("/StateDNI", "None");
                this.onDataEmployeeValidation();
            }
            }else{
                oModelEmployee.setProperty("/StateDNI", "Error");
            }
        },


    });
}); 