import { SelectQueryBuilder } from 'typeorm';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  dateField?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export class QueryBuilderUtil {
  /**
   * Apply pagination to a query builder
   */
  static paginate<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
  ): SelectQueryBuilder<T> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    return queryBuilder.skip(skip).take(limit);
  }

  /**
   * Get paginated results with metadata
   */
  static async getPaginatedResult<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
  ): Promise<PaginationResult<T>> {
    const { page, limit } = options;

    // Clone the query builder for counting
    const countQueryBuilder = queryBuilder.clone();

    // Apply pagination
    const paginatedQueryBuilder = this.paginate(queryBuilder, options);

    // Execute both queries in parallel
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

  /**
   * Apply search filter to query builder
   */
  static applySearch<T>(
    queryBuilder: SelectQueryBuilder<T>,
    search: string,
    fields: string[],
    alias: string,
  ): SelectQueryBuilder<T> {
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

  /**
   * Apply date range filter
   */
  static applyDateRange<T>(
    queryBuilder: SelectQueryBuilder<T>,
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    dateField: string,
    alias: string,
  ): SelectQueryBuilder<T> {
    if (dateFrom) {
      queryBuilder.andWhere(`${alias}.${dateField} >= :dateFrom`, { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere(`${alias}.${dateField} <= :dateTo`, { dateTo });
    }

    return queryBuilder;
  }

  /**
   * Apply sorting to query builder
   */
  static applySort<T>(
    queryBuilder: SelectQueryBuilder<T>,
    orderBy: string,
    orderDirection: 'ASC' | 'DESC' = 'DESC',
    alias: string,
  ): SelectQueryBuilder<T> {
    if (!orderBy) {
      return queryBuilder;
    }

    // Validate order direction
    const direction = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    return queryBuilder.orderBy(`${alias}.${orderBy}`, direction);
  }

  /**
   * Apply all filters at once
   */
  static applyFilters<T>(
    queryBuilder: SelectQueryBuilder<T>,
    filters: FilterOptions,
    alias: string,
  ): SelectQueryBuilder<T> {
    const { search, searchFields, dateFrom, dateTo, dateField, orderBy, orderDirection } = filters;

    // Apply search
    if (search && searchFields && searchFields.length > 0) {
      this.applySearch(queryBuilder, search, searchFields, alias);
    }

    // Apply date range
    if ((dateFrom || dateTo) && dateField) {
      this.applyDateRange(queryBuilder, dateFrom, dateTo, dateField, alias);
    }

    // Apply sorting
    if (orderBy) {
      this.applySort(queryBuilder, orderBy, orderDirection || 'DESC', alias);
    }

    return queryBuilder;
  }

  /**
   * Optimize query by selecting only required fields
   */
  static selectFields<T>(
    queryBuilder: SelectQueryBuilder<T>,
    fields: string[],
    alias: string,
  ): SelectQueryBuilder<T> {
    if (fields.length === 0) {
      return queryBuilder;
    }

    const selections = fields.map((field) => `${alias}.${field}`);
    return queryBuilder.select(selections);
  }

  /**
   * Add joins with proper loading strategy
   */
  static addJoins<T>(
    queryBuilder: SelectQueryBuilder<T>,
    joins: Array<{
      property: string;
      alias: string;
      condition?: string;
      parameters?: Record<string, any>;
      type?: 'left' | 'inner';
    }>,
    baseAlias: string,
  ): SelectQueryBuilder<T> {
    joins.forEach((join) => {
      const { property, alias, condition, parameters, type = 'left' } = join;
      const joinProperty = `${baseAlias}.${property}`;

      if (type === 'inner') {
        if (condition) {
          queryBuilder.innerJoinAndSelect(joinProperty, alias, condition, parameters);
        } else {
          queryBuilder.innerJoinAndSelect(joinProperty, alias);
        }
      } else {
        if (condition) {
          queryBuilder.leftJoinAndSelect(joinProperty, alias, condition, parameters);
        } else {
          queryBuilder.leftJoinAndSelect(joinProperty, alias);
        }
      }
    });

    return queryBuilder;
  }

  /**
   * Batch load related entities to avoid N+1 queries
   */
  static async batchLoadRelations<T, R>(
    entities: T[],
    relationLoader: (ids: string[]) => Promise<R[]>,
    entityIdGetter: (entity: T) => string,
    relationIdGetter: (relation: R) => string,
    relationSetter: (entity: T, relations: R[]) => void,
  ): Promise<T[]> {
    if (entities.length === 0) {
      return entities;
    }

    // Get unique IDs
    const ids = [...new Set(entities.map(entityIdGetter))];

    // Load all relations at once
    const relations = await relationLoader(ids);

    // Group relations by ID
    const relationMap = new Map<string, R[]>();
    relations.forEach((relation) => {
      const id = relationIdGetter(relation);
      if (!relationMap.has(id)) {
        relationMap.set(id, []);
      }
      relationMap.get(id)!.push(relation);
    });

    // Assign relations to entities
    entities.forEach((entity) => {
      const id = entityIdGetter(entity);
      const entityRelations = relationMap.get(id) || [];
      relationSetter(entity, entityRelations);
    });

    return entities;
  }

  /**
   * Create a subquery for complex filtering
   */
  static createSubquery<T>(
    queryBuilder: SelectQueryBuilder<T>,
    subqueryBuilder: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>,
    condition: string,
    parameters?: Record<string, any>,
  ): SelectQueryBuilder<T> {
    const subquery = subqueryBuilder(queryBuilder.subQuery());

    queryBuilder.andWhere(condition, parameters);

    return queryBuilder;
  }

  /**
   * Apply cursor-based pagination for large datasets
   */
  static applyCursorPagination<T>(
    queryBuilder: SelectQueryBuilder<T>,
    cursor: string | undefined,
    limit: number,
    cursorField: string,
    alias: string,
    direction: 'ASC' | 'DESC' = 'ASC',
  ): SelectQueryBuilder<T> {
    if (cursor) {
      const operator = direction === 'ASC' ? '>' : '<';
      queryBuilder.andWhere(`${alias}.${cursorField} ${operator} :cursor`, { cursor });
    }

    return queryBuilder.orderBy(`${alias}.${cursorField}`, direction).limit(limit + 1); // Fetch one extra to determine if there's a next page
  }
}
