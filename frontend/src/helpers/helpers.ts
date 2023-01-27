export const hiddenWidget = (fields:string[]) =>{
    let hiddenSchema = {}
    for (const f of fields){
        hiddenSchema = {...hiddenSchema,
                        [f]:{
                            "ui:widget":"hidden"
                        }}
    }
    return hiddenSchema
}

export const removeFieldsFromSchema = (schema:any, fields:string[]) =>{
    for (const f of fields){
        delete schema.properties[f];
        const index = schema.required.indexOf(f);
        if(index > -1) {
            const x = schema.required.splice(index, 1);
        }
    }
    return schema;
}