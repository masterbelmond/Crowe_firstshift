/**
 * @NScriptName firstshift | UE | Purchase Order Sync
 * @NScriptId customscript_ue_fs_purchaseorder
 * @author eli@crowe
 * @filename firstshift_ue_purchaseorder_sync.js
 * @description User-event script to sync Purchase Order data to firstshift
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @NAmdConfig ../SuiteScripts/firstshift_config.json
 *
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=
 * @fileoverview
 * Version    Date            Author           Remarks
 * 1.00       21 Jan 2023     eli@crowe        Initial version
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

            var syncToFirstShift = newRecord.getValue({fieldId: 'custbody_sync_firstshift'});
            if(!syncToFirstShift){
               return;
            }

            var arrMappingsOrderDetails = FS.getFirstShiftMappings(GLOBAL_CONSTANT.ORDER.PURCHASE_ORDER_DETAIL);
            log.debug('arrMappingsOrderDetails', JSON.stringify(arrMappingsOrderDetails));

            var payload = {};
            var payloadEntityName = {};
            var arrRowData = [];

            if(!FS.isEmpty(arrMappingsOrderDetails)){

               var purchaseOrderItemLineCount = newRecord.getLineCount({sublistId: 'item'});

               var rowData = {};

               for(var i in arrMappingsOrderDetails) {

                  var netSuiteId = arrMappingsOrderDetails[i].netsuite_id;
                  var firstShiftId = arrMappingsOrderDetails[i].firstshift_id;
                  var line_level = arrMappingsOrderDetails[i].line_level;
                  var _type = arrMappingsOrderDetails[i].type;

                  for (var f = 0; f < purchaseOrderItemLineCount; f++) {
                     if(line_level){
                        var tempLineValue = newRecord.getSublistValue({sublistId: 'item', fieldId: netSuiteId, line: f});
                        if (FS.isEmpty(tempLineValue)) {
                           tempLineValue = newRecord.getSublistText({sublistId: 'item', fieldId: netSuiteId, line: f});
                        }
                        if (!FS.isEmpty(tempLineValue)) {
                           log.debug('LOOP', 'netSuiteId: ' + netSuiteId + ' | firstShiftId: ' + firstShiftId + ' | value: ' + tempLineValue);
                           rowData[firstShiftId] = tempLineValue.toString();
                        }
                     }
                     else{
                        var tempHeaderValue = newRecord.getValue({fieldId: netSuiteId.toString()});
                        if(!FS.isEmpty(tempHeaderValue) && _type === 'date'){
                           tempHeaderValue = tempHeaderValue.getTime();
                        }
                        if(FS.isEmpty(tempHeaderValue)){
                           tempHeaderValue = newRecord.getText({fieldId: netSuiteId.toString()});
                        }
                        if(!FS.isEmpty(tempHeaderValue)) {
                           log.debug('LOOP', 'netSuiteId: ' + netSuiteId + ' | firstShiftId: ' + firstShiftId + ' | value: ' + tempHeaderValue);
                           rowData[firstShiftId] = tempHeaderValue.toString();
                        }
                     }
                  }
               }

               log.debug('rowData', JSON.stringify(rowData));

               if(!FS.isEmpty(rowData)){

                  arrRowData.push(rowData);
                  payloadEntityName.ENTITY_NAME = GLOBAL_CONSTANT.ORDER.PURCHASE_ORDER_DETAIL;
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

                  var urlPurchaseOrderDetails = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.POST.PURCHASE_ORDER_DETAIL + GLOBAL_CONSTANT.ORDER.PURCHASE_ORDER_DETAIL;
                  log.debug('urlPurchaseOrderDetails', 'value: ' + urlPurchaseOrderDetails);

                  var response = https.post({
                     url: urlPurchaseOrderDetails,
                     headers: headers,
                     body : JSON.stringify(payload)
                  });

                  var strResponseBody = '';
                  var strResponseCode = response.code;

                  if (strResponseCode === 200 || strResponseCode === 201) {
                     strResponseBody = JSON.parse(response.body);
                     log.debug('strResponseBody', JSON.stringify(strResponseBody));
                  }

               }
            }
         }
         catch(ex){
            log.error({title: 'firstshift | UE | Purchase Order Sync', details: JSON.stringify(ex)});
         }
      }

      //region FUNCTIONS

      //endregion FUNCTIONS


      return {
         afterSubmit : afterSubmit
      };
   }
);