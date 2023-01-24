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