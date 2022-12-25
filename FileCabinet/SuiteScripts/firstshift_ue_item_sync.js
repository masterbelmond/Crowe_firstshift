/**
 * @NScriptName firstshift | UE | Item Sync
 * @NScriptId customscript_ue_fs_item_sync
 * @author eli@crowe
 * @filename firstshift_ue_item_sync.js
 * @description User-event script to sync item data to firstshift
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @NAmdConfig ../SuiteScripts/firstshift_config.json
 *
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=3905
 * @fileoverview
 * Version    Date            Author           Remarks
 * 1.00       18 Dec 2022     eli@crowe        Initial version
 *
 */

define(['common', 'N/runtime', 'N/record', 'N/https'],

   function (FS, runtime, record, https) {

      function afterSubmit(context){

         var GLOBAL_CONSTANT = FS.GLOBAL_CONSTANT();

         try {

            if (context.type === context.UserEventType.DELETE) {
               return;
            }

            var newRecord = context.newRecord;

            var syncToFirstShift = newRecord.getValue({fieldId: 'custitem_sync_firstshift'});
            if(!syncToFirstShift){
               return;
            }

            var arrMappings = FS.getFirstShiftMappings(GLOBAL_CONSTANT.ENTITY.PRODUCT_MASTER);
            log.debug('arrMappings', JSON.stringify(arrMappings));

            var payload = {};
            var payloadEntityName = {};
            var arrRowData = [];

            if(!FS.isEmpty(arrMappings)){

               var rowData = {};

               for(var i in arrMappings) {

                  var netSuiteId = arrMappings[i].netsuite_id;
                  var firstShiftId = arrMappings[i].firstshift_id;

                  var tempValue = newRecord.getText({fieldId: netSuiteId.toString()});
                  if(FS.isEmpty(tempValue)){
                     tempValue = newRecord.getValue({fieldId: netSuiteId.toString()});
                  }

                  if(!FS.isEmpty(tempValue)) {
                     log.debug('LOOP', 'netSuiteId: ' + netSuiteId + ' | firstShiftId: ' + firstShiftId + ' | value: ' + tempValue);
                     rowData[firstShiftId] = tempValue.toString();
                  }

               }

               log.debug('rowData', JSON.stringify(rowData));

               if(!FS.isEmpty(rowData)){

                  arrRowData.push(rowData);
                  payloadEntityName.ENTITY_NAME = GLOBAL_CONSTANT.ENTITY.PRODUCT_MASTER;
                  payload.ENTITY_META_DATA = payloadEntityName;
                  payload.rowData = arrRowData;

                  var tokenResponse = FS.getTokenResponse();
                  var tenantId = FS.getTenantId(tokenResponse);
                  var accesstoken = FS.getToken(tokenResponse);

                  log.debug('accesstoken: ' + accesstoken, JSON.stringify(payload));

                  if(FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)){
                     return;
                  }

                  var headers = new Object();
                  headers['Content-Type'] = 'application/json;charset=utf-8';
                  headers['Accept'] = 'application/json';
                  headers['User-Agent-x'] = 'SuiteScript-Call';
                  headers['access-token'] = accesstoken;

                  var urlPostProductMaster = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.POST.PRODUCT_MASTER + GLOBAL_CONSTANT.ENTITY.PRODUCT_MASTER;
                  log.debug('urlPostProductMaster', 'value: ' + urlPostProductMaster);

                  var response = https.post({
                     url: urlPostProductMaster,
                     headers: headers,
                     body : JSON.stringify(payload)
                  });

                  var strResponseBody = '';
                  var strResponseCode = response.code;

                  if (strResponseCode == 200 || strResponseCode == 201) {
                     strResponseBody = JSON.parse(response.body);
                     log.debug('strResponseBody', 'value: ' + strResponseBody.data.rowData);
                     /*
                     var isSuccess = strResponseBody.success;
                     if(isSuccess){

                     }
                      */
                  }

               }
            }

         }
         catch(ex){
            log.error({title: 'firstshift | UE | Item Sync', details: JSON.stringify(ex)});
         }
      }

      //region FUNCTIONS

      //endregion FUNCTIONS


      return {
         afterSubmit : afterSubmit
      };
   }
);