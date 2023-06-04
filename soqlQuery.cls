public without sharing class soqlQuery {
    public class sObjectData {
        public String apiName;
        public String label;
        public fieldData[] fields = new fieldData[]{};

        public sObjectData(Schema.DescribeSObjectResult description){
            apiName = description.getName();
            label = description.getLabel();
            for (Schema.SObjectField field : description.fields.getMap().values()){
                fields.add(new fieldData(field.getDescribe()));
            }

        }

    }

    public class fieldData {
        public String apiName;
        public String label;
        public String type;
        
        public fieldData(Schema.DescribeFieldResult description){
            apiName = description.getName();
            label = description.getLabel();
            switch on description.getSOAPType().name(){
                when 'Boolean' { type = 'boolean';}
                when 'ID','String'{ type = 'useQuotes';}
                when else { type = 'noQuotes';}
            }

        }

    }
    
    public class queryResult {
        @AuraEnabled public SObject[] records;
        @AuraEnabled public String[] fields; 

        public queryResult(List<SObject> records){
            this.records = records;
            if(!records.isEmpty()){
                System.debug(records[0].getPopulatedFieldsAsMap());
                fields = new List<String> (records[0].getPopulatedFieldsAsMap().keySet());   
            }
            System.debug(records);
            System.debug(fields);  
        }
    } 

    @AuraEnabled(cacheable=true)
    public static String allObjectData()
    {
        Map<String , sObjectData> allSObjectData = new Map<String , sObjectData>{};
        Integer count = 0;
        Integer max_count = 100;
        for(Schema.SObjectType sObjectType : Schema.getGlobalDescribe().values()){
        Schema.DescribeSObjectResult result = sObjectType.getDescribe();
        if(count <= max_count && isWantedObject(result)){
        allSObjectData.put(result.getName() , new sObjectData(result));
        count++; 
            }        
        }  
        system.debug(allSObjectData);
        return JSON.serialize(allSObjectData);

    }

    // Handle query from JS

    @AuraEnabled(cacheable=true)
    public static queryResult findRecords(String query) {
        queryResult result = new queryResult(Database.query(query));
        system.debug(result);
        return result;
    }
   
    private static boolean isWantedObject(Schema.DescribeSObjectResult result)
    {
        Boolean hasNoPrefix = String.isBlank(result.getKeyPrefix());
        Boolean customSetting = result.isCustomSetting();
        Boolean customMetaData = result.getName().endsWith('__mdt');
        Boolean platformEvent = result.getName().endsWith('__e');
        Boolean weirdObject = hasNoPrefix || customSetting || customMetaData || platformEvent ;
        
        return !weirdObject;
    }

}
