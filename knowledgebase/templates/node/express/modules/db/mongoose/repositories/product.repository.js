import MongoRepository from "./mongoRepository.js";
import Product from "../models/product.model.js";

class ProductRepository extends MongoRepository {
    constructor() {
        super(Product);
    }

    async findByName(name) {
        return this.model.findOne({ name });
    }

    async search(keyword) {
        return this.model.find({
            name: {
                $regex: keyword,
                $options: "i"
            }
        });
    }
}

export default new ProductRepository();