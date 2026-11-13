from datetime import datetime, timezone

from bson import ObjectId


async def create_analysis(database, analysis_data):

    document = {
        **analysis_data,
        "created_at": datetime.now(timezone.utc)
    }

    result = await database.analyses.insert_one(document)

    return str(result.inserted_id)


async def get_analysis_by_id(database, analysis_id):

    if not ObjectId.is_valid(analysis_id):
        return None

    document = await database.analyses.find_one({
        "_id": ObjectId(analysis_id)
    })

    if document:
        document["_id"] = str(document["_id"])

    return document


async def get_student_analyses(database, student_id):

    cursor = database.analyses.find({
        "student_id": student_id
    }).sort("created_at", -1)

    documents = await cursor.to_list(length=100)

    for document in documents:
        document["_id"] = str(document["_id"])

    return documents


async def delete_analysis(database, analysis_id):

    if not ObjectId.is_valid(analysis_id):
        return False

    result = await database.analyses.delete_one({
        "_id": ObjectId(analysis_id)
    })

    return result.deleted_count == 1
async def update_analysis_status(
    database,
    analysis_id,
    new_status
):

    if not ObjectId.is_valid(analysis_id):
        return False

    result = await database.analyses.update_one(
        {
            "_id": ObjectId(analysis_id)
        },
        {
            "$set": {
                "workflow_status": new_status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    return result.modified_count == 1