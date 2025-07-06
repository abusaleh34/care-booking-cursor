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
export declare class QueryBuilderUtil {
    static paginate<T>(queryBuilder: SelectQueryBuilder<T>, options: PaginationOptions): SelectQueryBuilder<T>;
    static getPaginatedResult<T>(queryBuilder: SelectQueryBuilder<T>, options: PaginationOptions): Promise<PaginationResult<T>>;
    static applySearch<T>(queryBuilder: SelectQueryBuilder<T>, search: string, fields: string[], alias: string): SelectQueryBuilder<T>;
    static applyDateRange<T>(queryBuilder: SelectQueryBuilder<T>, dateFrom: Date | undefined, dateTo: Date | undefined, dateField: string, alias: string): SelectQueryBuilder<T>;
    static applySort<T>(queryBuilder: SelectQueryBuilder<T>, orderBy: string, orderDirection: 'ASC' | 'DESC', alias: string): SelectQueryBuilder<T>;
    static applyFilters<T>(queryBuilder: SelectQueryBuilder<T>, filters: FilterOptions, alias: string): SelectQueryBuilder<T>;
    static selectFields<T>(queryBuilder: SelectQueryBuilder<T>, fields: string[], alias: string): SelectQueryBuilder<T>;
    static addJoins<T>(queryBuilder: SelectQueryBuilder<T>, joins: Array<{
        property: string;
        alias: string;
        condition?: string;
        parameters?: Record<string, any>;
        type?: 'left' | 'inner';
    }>, baseAlias: string): SelectQueryBuilder<T>;
    static batchLoadRelations<T, R>(entities: T[], relationLoader: (ids: string[]) => Promise<R[]>, entityIdGetter: (entity: T) => string, relationIdGetter: (relation: R) => string, relationSetter: (entity: T, relations: R[]) => void): Promise<T[]>;
    static createSubquery<T>(queryBuilder: SelectQueryBuilder<T>, subqueryBuilder: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, condition: string, parameters?: Record<string, any>): SelectQueryBuilder<T>;
    static applyCursorPagination<T>(queryBuilder: SelectQueryBuilder<T>, cursor: string | undefined, limit: number, cursorField: string, alias: string, direction?: 'ASC' | 'DESC'): SelectQueryBuilder<T>;
}
