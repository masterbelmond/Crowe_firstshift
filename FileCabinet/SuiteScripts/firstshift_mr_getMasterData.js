/**
 * @NScriptName firstshift | MR | getMasterData
 * @NScriptId customscript_mr_fs_get_masterdata
 * @author eli@crowe
 * @filename firstshift_mr_getMasterData.js
 * @description Map/Reduce script to populate the "firstshift | Master Data"
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @NAmdConfig ../SuiteScripts/firstshift_config.json
 *
 * https://tstdrv2685009.app.netsuite.com/app/common/scripting/script.nl?id=3904
 * Custom Record: firstshift | Master Data : https://tstdrv2685009.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=1678
 * Custom Record: firstshift | Mappings : https://tstdrv2685009.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=1679
 * @fileoverview
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2022     eli@crowe        Initial version
 *
 */

define(['common', 'N/record', 'N/runtime', 'N/url', 'N/https', 'N/search'],
   /**
    * @param {record} record
    */
   function(FS, record, runtime, url, https, search) {

      var GLOBAL_CONSTANT = FS.GLOBAL_CONSTANT();

      /**
       * Marks the beginning of the Map/Reduce process and generates input data.
       *
       * @typedef {Object} ObjectRef
       * @property {number} id - Internal ID of the record instance
       * @property {string} type - Record type id
       *
       * @return {Array|Object|Search|RecordRef} inputSummary
       * @since 2015.1
       */
      function getInputData() {
         try{
            var arr = getMasterData();
            log.debug('getInputData', JSON.stringify(arr));
            return arr;
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      /**
       * Executes when the map entry point is triggered and applies to each key/value pair.
       *
       * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
       * @since 2015.1
       */
      function map(context) {
         try {
            var valuePairs = JSON.parse(context.value);
            context.write({
               key: valuePairs._id,
               value: {
                  id: valuePairs._id,
                  entity_name: valuePairs.ENTITY_NAME,
                  _type : valuePairs._type
               }
            });
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      /**
       * Executes when the reduce entry point is triggered and applies to each group.
       *
       * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
       * @since 2015.1
       */
      function reduce(context) {
         var valueArr = context.values.map(function (value) {
            return JSON.parse(value);
         });
         try {
            var masterDataId = createMasterData(valueArr[0]);
            //Create Master Data Fields
            if(!FS.isEmpty(masterDataId)){

               var searchMasterDataEntityName = search.lookupFields({
                  type: 'customrecord_fs_master_data',
                  id: masterDataId,
                  columns : ['custrecord_fs_md_entity_name']
               });
               var masterDataEntityName = searchMasterDataEntityName['custrecord_fs_md_entity_name'];
               if(!FS.isEmpty(masterDataEntityName)) {
                  var arrMasterDataMappings = getMasterDataMappings(masterDataEntityName);
                  for(var m in arrMasterDataMappings){
                     createMasterDataMappings(masterDataId, arrMasterDataMappings[m]);
                  }
               }

            }
         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      /**
       * Executes when the summarize entry point is triggered and applies to the result set.
       *
       * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
       * @since 2015.1
       */
      function summarize(summary) {
         try {
            var type = summary.toString();
            log.audit('SUMMARY', 'Full summary: ' + summary);
            log.audit('SUMMARY', 'Usage Consumed: ' + summary.usage);
            log.audit('SUMMARY', 'Concurrency Number : ' + summary.concurrency);
            log.audit('SUMMARY', 'Number of Yields: ' + summary.yields);

         }
         catch(e){
            log.error({
               title: e.name,
               details: e.message
            });
         }
      }

      //region FUNCTIONS
      function getMasterData(){

         var arr = [];
         var tokenResponse = FS.getTokenResponse();
         var tenantId = FS.getTenantId(tokenResponse);
         var accesstoken = FS.getToken(tokenResponse);

         if(FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)){
            return;
         }

         log.debug('FS', 'tenantId: ' + tenantId + ' | accesstoken: ' + accesstoken);

         var headers = new Object();
         headers['Content-Type'] = 'application/json;charset=utf-8';
         headers['Accept'] = 'application/json';
         headers['User-Agent-x'] = 'SuiteScript-Call';
         headers['access-token'] = accesstoken;

         var urlGetMasterEntityData = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.GET.MASTER_DATA;

         var responseMasterEntityData = https.get({
            url: urlGetMasterEntityData,
            headers: headers
         });

         var strMasterEntityResponseBody = '';
         var strMasterEntityResponseCode = responseMasterEntityData.code;

         if (strMasterEntityResponseCode === 200 || strMasterEntityResponseCode === 201) {
            strMasterEntityResponseBody = JSON.parse(responseMasterEntityData.body);
            var isSuccessMasterEntity = strMasterEntityResponseBody.success;
            if(isSuccessMasterEntity){
               log.debug('MASTER ENTITY', JSON.stringify(strMasterEntityResponseBody.data.rowData));
               var arrMasterEntity = strMasterEntityResponseBody.data.rowData;
               for(var m in arrMasterEntity){
                  arr.push({
                     _type : 'entity',
                     _id : arrMasterEntity[m]._id,
                     ENTITY_NAME : arrMasterEntity[m].ENTITY_NAME
                  });
               }
            }
         }

         var urlGetOrderData = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.GET.ORDER_DATA;

         var responseOrderData = https.get({
            url: urlGetOrderData,
            headers: headers
         });

         var strOrderResponseBody = '';
         var strOrderResponseCode = responseOrderData.code;

         if (strOrderResponseCode === 200 || strOrderResponseCode === 201) {
            strOrderResponseBody = JSON.parse(responseOrderData.body);
            var isSuccessOrder = strOrderResponseBody.success;
            if(isSuccessOrder) {
               log.debug('ORDERS', JSON.stringify(strOrderResponseBody.data.rowData));
               var arrOrder = strOrderResponseBody.data.rowData;
               for(var o in arrOrder){
                  arr.push({
                     _type : 'order',
                     _id : arrOrder[o]._id,
                     ENTITY_NAME : arrOrder[o].ENTITY_NAME
                  });
               }
            }
         }

         log.debug('arr', JSON.stringify(arr));
         return arr;
      }

      function createMasterData(valueArr){

         var id = valueArr.id;
         var entity_name = valueArr.entity_name;
         var _type = valueArr._type;

         var create = record.create({
            type : 'customrecord_fs_master_data'
         });
         var externalId = id + '_' + entity_name;
         create.setValue({fieldId: 'externalid', value: entity_name});
         create.setValue({fieldId: 'name', value: entity_name});
         create.setValue({fieldId: 'custrecord_fs_md_type', value: _type});
         create.setValue({fieldId: 'custrecord_fs_md_id', value: id});
         create.setValue({fieldId: 'custrecord_fs_md_entity_name', value: entity_name});
         var masterDataId = create.save();
         return masterDataId;
      }

      ///model/mappings/MasterData
      function getMasterDataMappings(masterDataEntityName){

         var rowData = [];
         var tokenResponse = FS.getTokenResponse();
         var tenantId = FS.getTenantId(tokenResponse);
         var accesstoken = FS.getToken(tokenResponse);

         if(FS.isEmpty(tenantId) || FS.isEmpty(accesstoken)){
            return;
         }

         log.debug('FS', 'tenantId: ' + tenantId + ' | accesstoken: ' + accesstoken);

         var headers = new Object();
         headers['Content-Type'] = 'application/json;charset=utf-8';
         headers['Accept'] = 'application/json';
         headers['User-Agent-x'] = 'SuiteScript-Call';
         headers['access-token'] = accesstoken;

         var urlGetMasterData = GLOBAL_CONSTANT.ENDPOINT.URI + '/configurations/' + tenantId + GLOBAL_CONSTANT.ENDPOINT.GET.MASTER_DATA_MAPPINGS + '/' + masterDataEntityName;

         var response = https.get({
            url: urlGetMasterData,
            headers: headers
         });

         var strResponseBody = '';
         var strResponseCode = response.code;

         if (strResponseCode == 200 || strResponseCode == 201) {
            strResponseBody = JSON.parse(response.body);
            var isSuccess = strResponseBody.success;
            if(isSuccess){
               log.debug('strResponseBody: getMasterDataEntityAttributes', 'value: ' + JSON.stringify(strResponseBody.data.rowData));
               rowData = strResponseBody.data.rowData;
            }
         }
         return rowData;
      }

      function createMasterDataMappings(masterDataId, valueArr){

         var id = valueArr._id;
         var displayName = valueArr.DISPLAY_NAME;
         var sourceTableColumn = valueArr.SOURCE_TABLE_COLUMN;

         var create = record.create({
            type : 'customrecord_fs_mappings'
         });
         var externalId = id + '_' + sourceTableColumn;
         create.setValue({fieldId: 'externalid', value: externalId});
         create.setValue({fieldId: 'name', value: displayName});
         create.setValue({fieldId: 'custrecord_fs_map_data_type', value: masterDataId});
         create.setValue({fieldId: 'custrecord_fs_display_name', value: displayName});
         create.setValue({fieldId: 'custrecord_fs_source_table_column', value: sourceTableColumn});
         var masterDataMappingId = create.save();
         return masterDataMappingId;
      }
      //endregion FUNCTIONS


      return {
         getInputData: getInputData,
         map: map,
         reduce: reduce,
         summarize: summarize
      };

   });