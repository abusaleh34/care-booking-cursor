"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilderUtil = void 0;
class QueryBuilderUtil {
    static paginate(queryBuilder, options) {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        return queryBuilder.skip(skip).take(limit);
    }
    static async getPaginatedResult(queryBuilder, options) {
        const { page, limit } = options;
        const countQueryBuilder = queryBuilder.clone();
        const paginatedQueryBuilder = this.paginate(queryBuilder, options);
        const [data, total] = await Promise.all([
            paginatedQueryBuilder.getMany(),
            countQueryBuilder.getCount(),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    static applySearch(queryBuilder, search, fields, alias) {
        if (!search || fields.length === 0) {
            return queryBuilder;
        }
        const searchConditions = fields
            .map((field) => `LOWER(${alias}.${field}) LIKE LOWER(:search)`)
            .join(' OR ');
        return queryBuilder.andWhere(`(${searchConditions})`, {
            search: `%${search}%`,
        });
    }
    static applyDateRange(queryBuilder, dateFrom, dateTo, dateField, alias) {
        if (dateFrom) {
            queryBuilder.andWhere(`${alias}.${dateField} >= :dateFrom`, { dateFrom });
        }
        if (dateTo) {
            queryBuilder.andWhere(`${alias}.${dateField} <= :dateTo`, { dateTo });
        }
        return queryBuilder;
    }
    static applySort(queryBuilder, orderBy, orderDirection = 'DESC', alias) {
        if (!orderBy) {
            return queryBuilder;
        }
        const direction = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        return queryBuilder.orderBy(`${alias}.${orderBy}`, direction);
    }
    static applyFilters(queryBuilder, filters, alias) {
        const { search, searchFields, dateFrom, dateTo, dateField, orderBy, orderDirection } = filters;
        if (search && searchFields && searchFields.length > 0) {
            this.applySearch(queryBuilder, search, searchFields, alias);
        }
        if ((dateFrom || dateTo) && dateField) {
            this.applyDateRange(queryBuilder, dateFrom, dateTo, dateField, alias);
        }
        if (orderBy) {
            this.applySort(queryBuilder, orderBy, orderDirection || 'DESC', alias);
        }
        return queryBuilder;
    }
    static selectFields(queryBuilder, fields, alias) {
        if (fields.length === 0) {
            return queryBuilder;
        }
        const selections = fields.map((field) => `${alias}.${field}`);
        return queryBuilder.select(selections);
    }
    static addJoins(queryBuilder, joins, baseAlias) {
        joins.forEach((join) => {
            const { property, alias, condition, parameters, type = 'left' } = join;
            const joinProperty = `${baseAlias}.${property}`;
            if (type === 'inner') {
                if (condition) {
                    queryBuilder.innerJoinAndSelect(joinProperty, alias, condition, parameters);
                }
                else {
                    queryBuilder.innerJoinAndSelect(joinProperty, alias);
                }
            }
            else {
                if (condition) {
                    queryBuilder.leftJoinAndSelect(joinProperty, alias, condition, parameters);
                }
                else {
                    queryBuilder.leftJoinAndSelect(joinProperty, alias);
                }
            }
        });
        return queryBuilder;
    }
    static async batchLoadRelations(entities, relationLoader, entityIdGetter, relationIdGetter, relationSetter) {
        if (entities.length === 0) {
            return entities;
        }
        const ids = [...new Set(entities.map(entityIdGetter))];
        const relations = await relationLoader(ids);
        const relationMap = new Map();
        relations.forEach((relation) => {
            const id = relationIdGetter(relation);
            if (!relationMap.has(id)) {
                relationMap.set(id, []);
            }
            relationMap.get(id).push(relation);
        });
        entities.forEach((entity) => {
            const id = entityIdGetter(entity);
            const entityRelations = relationMap.get(id) || [];
            relationSetter(entity, entityRelations);
        });
        return entities;
    }
    static createSubquery(queryBuilder, subqueryBuilder, condition, parameters) {
        const subquery = subqueryBuilder(queryBuilder.subQuery());
        queryBuilder.andWhere(condition, parameters);
        return queryBuilder;
    }
    static applyCursorPagination(queryBuilder, cursor, limit, cursorField, alias, direction = 'ASC') {
        if (cursor) {
            const operator = direction === 'ASC' ? '>' : '<';
            queryBuilder.andWhere(`${alias}.${cursorField} ${operator} :cursor`, { cursor });
        }
        return queryBuilder.orderBy(`${alias}.${cursorField}`, direction).limit(limit + 1);
    }
}
exports.QueryBuilderUtil = QueryBuilderUtil;
//# sourceMappingURL=query-builder.util.js.map