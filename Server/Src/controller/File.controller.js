import {File} from ("../models/File");
const deleteFile = async(req, res)=>{
    try {
        const {id} = req.params;
        const file = await File.findByIdAndUpdate(
            id, {isDeleted: true, deletedAt: new Date()},
            {new:true}
        );
        if(!file){
            return res.status(404).send({message:"File not found", isSuccess: false});
        }
        res.send({message: "deleted succesfully", isSuccess: true});
    } catch (error) {
        res.status(500).send({message: "error deleting file", isSuccess: false});
    }
};
export {deleteFile};
