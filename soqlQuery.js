import { LightningElement, track } from 'lwc';
import getAllData from '@salesforce/apex/soqlQuery.allObjectData';
import findRecords from '@salesforce/apex/soqlQuery.findRecords';

export default class SoqlQuery extends LightningElement {
    isLoading;
    objectName;
    query;
    columns;
    error;
    @track queryRecords;
    @track objectOptions;
    @track fieldOptions;
   
    connectedCallback(){
        this.isLoading = true;
        getAllData()
        .then((result)=>{
            this.allData = JSON.parse(result)
            this.objectOptions = this.getOptions(Object.values(this.allData));
            this.optionsSort(this.objectOptions);
                })
        .catch()
        .finally(()=>{            
            this.isLoading = false;
        });    
    };

    // controls the dropdown for selecting object
    selectObject(event){
        this.objectName = event.target.value;
        this.fieldOptions = this.getOptions(this.allData[this.objectName].fields)
        this.optionsSort(this.fieldOptions);
    };

    // controls dropdown for selecting field 
    selectFields(event){
        let selectedFields = [];
        for (let selectedOption of event.target.selectedOptions)
        {
            selectedFields.push(selectedOption.value);
        };

        this.generateQuery(this.objectName, selectedFields);
    };

    // Build query with selected options
    generateQuery(sObjectName, fields){
      this.query = 'SELECT ' + fields.join(', ') + ' FROM ' + sObjectName;
    };

    // Call apex to run query 
    submitQuery(){
        let inputQuery = this.template.querySelector('lightning-input.query').value;
        this.handleSearch(inputQuery);
    };        
 
    // Returns query results from Apex 
    handleSearch(inputQuery) {
        findRecords({ query: inputQuery })
            .then(result => {
                let records = result.records;
                let fieldNames = result.fields;
                console.log(records); 
                this.queryRecords = records;               
                this.error = undefined;
                this.buildColumns(fieldNames);
                console.log('success')
                console.log(fieldNames);
            })

        .catch((error) => {
            console.log('fucked');
            this.error = error;
            console.log(this.queryRecords);
            this.queryRecords = undefined;
        });

    };

    // Create columns from the records from the query
    buildColumns(fields){  
        this.columns = [];      
        fields.forEach( field => {
            this.columns.push({ label: field , fieldName: field , type: 'string'})   
        });            
    };
    
    getOptions(optionsData){
        let options = [];
        optionsData.forEach(data => {
            options.push(
                {value: data.apiName , label: data.label }
            );    
        });
        return options;
    };

    optionsSort(options){
        options.sort((a, b)=>{
            let x = a.label.toLowerCase();
            let y = b.label.toLowerCase();
            if (x < y) {return -1;}
            if (x > y) {return 1;}
            return 0;
          });

    }

};
