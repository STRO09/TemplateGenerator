import repositories from "../db/provider.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { getPagination, buildPagination } from "../utils/pagination.js";

const { product: productRepository } = repositories;

class ProductService {
  async create(productData) {
    const existing = await productRepository.findByName(productData.name);

    if (existing) {
      throw new ApiError({
        statusCode: 409,
        message: "A product with this name already exists.",
      });
    }

    logger.info("Creating product", {
      name: productData.name,
      price: productData.price,
    });

    return productRepository.create(productData);
  }

  async getAll() {
    return productRepository.findAll();
  }

  async getById(id) {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new ApiError({
        statusCode: 404,
        message: "Product not found.",
      });
    }

    return product;
  }

  async findPaginated({ page, limit, search = "" }) {
    const pagination = getPagination({
      page,
      limit,
    });
    const filter = {};

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    const { items, total } = await productRepository.findPaginated(
      filter,
      pagination,
    );

    return {
      items,
      pagination: buildPagination({
        ...pagination,
        total,
      }),
    };
  }
}

export default new ProductService();
