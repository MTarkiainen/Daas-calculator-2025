// supabaseMock.ts
import { Session, User } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  INITIAL_USERS,
  INITIAL_LEASE_RATE_FACTORS_DATA,
  INITIAL_WORKFLOW_SETTINGS,
  INITIAL_TCO_SETTINGS
} from './constants';
import { UserRole } from "./types";


// Very loose types on purpose so this compiles even if your app types change
type AnyRecord = Record<string, any>;

interface MockSession extends Session {
  user: User;
}

interface AuthChangeCallback {
  (event: string, session: Session | null): void;
}

/**
 * In-memory "database" seeded with initial data
 */
const db: Record<string, AnyRecord[]> = {
  profiles: INITIAL_USERS.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    company_name: p.companyName,
    phone: p.phone,
    logo_base_64: p.logoBase64,
    commission_percentage: p.commissionPercentage,
    country: p.country,
    must_change_password_on_next_login: p.mustChangePasswordOnNextLogin,
  })),
  quotes: [],
  lease_rate_factors: [{ id: 1, data: INITIAL_LEASE_RATE_FACTORS_DATA }],
  templates: [],
  workflow_settings: [{ id: 1, data: INITIAL_WORKFLOW_SETTINGS }],
  branding_settings: [{ id: 1, data: { appLogoBase64: null } }],
  tco_settings: [{ id: 1, data: INITIAL_TCO_SETTINGS }],
  activity_log: [],
  login_history: [],
};

// Use the admin user from the initial data for the default session
const initialAdminProfile = INITIAL_USERS.find(u => u.role === UserRole.Admin)!;

const initialAdminUser: User = {
  id: initialAdminProfile.id,
  app_metadata: { provider: 'email' },
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: initialAdminProfile.email,
} as unknown as User;


let currentSession: MockSession | null = {
  access_token: "mock-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-refresh",
  user: initialAdminUser,
} as unknown as MockSession;

const authSubscribers = new Set<AuthChangeCallback>();

/**
 * Helper: notify all auth listeners
 */
const notifyAuthSubscribers = () => {
  for (const cb of authSubscribers) {
    cb(currentSession ? "SIGNED_IN" : "SIGNED_OUT", currentSession);
  }
};

type Operation = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

/**
 * A tiny query builder that mimics Supabase's chainable API and is "thenable"
 */
class MockQueryBuilder {
  private table: string;
  private operation: Operation | null = null;
  private filters: { field: string; value: any }[] = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private singleResult = false;
  private selectCalled = false;
  private columns = '*';
  private values: AnyRecord | AnyRecord[] | null = null;

  constructor(table: string) {
    this.table = table;
  }
  
  private setOperation(op: Operation) {
    // A write operation can only be set once. `select` can be chained after a write.
    if (this.operation === null) {
      this.operation = op;
    } else if (op === 'select') {
      this.selectCalled = true;
    } else {
      console.error(`Supabase mock error: Cannot chain operation '${op}' after '${this.operation}'`);
    }
  }

  // RPC methods
  select(columns = '*') {
    this.columns = columns; // For mock, we don't use this, but keep for API compatibility
    this.setOperation('select');
    return this;
  }
  
  insert(values: AnyRecord | AnyRecord[]) {
    this.values = values;
    this.setOperation('insert');
    return this;
  }
  
  update(values: AnyRecord) {
    this.values = values;
    this.setOperation('update');
    return this;
  }
  
  upsert(values: AnyRecord | AnyRecord[]) {
    this.values = values;
    this.setOperation('upsert');
    return this;
  }
  
  delete() {
    this.setOperation('delete');
    return this;
  }

  // Modifiers
  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  // Executor (Thenable)
  then(onfulfilled: (value: { data: any; error: any }) => void, onrejected: (reason: any) => void) {
    // If no operation was specified, default to select
    if (this.operation === null) {
        this.operation = 'select';
    }
    this.execute().then(onfulfilled, onrejected);
  }

  private getTable(): AnyRecord[] {
    if (!db[this.table]) {
      db[this.table] = [];
    }
    return db[this.table];
  }

  private applyFilters(rows: AnyRecord[]): AnyRecord[] {
    if (this.filters.length === 0) return rows;
    return rows.filter((row) =>
      this.filters.every((f) => row[f.field] === f.value)
    );
  }

  private applyOrder(rows: AnyRecord[]): AnyRecord[] {
    if (!this.orderField) return rows;
    const field = this.orderField;
    const asc = this.orderAscending;
    return [...rows].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      if (av == null) return asc ? -1 : 1;
      if (bv == null) return asc ? 1 : -1;
      if (av < bv) return asc ? -1 : 1;
      return asc ? 1 : -1;
    });
  }

  private async execute(): Promise<{ data: any; error: any }> {
    let resultData: AnyRecord[] | null = null;
    let error: any = null;
    const table = this.getTable();

    switch (this.operation) {
        case 'select':
            resultData = this.applyOrder(this.applyFilters(table));
            break;
        
        case 'insert':
            const rowsToInsert = Array.isArray(this.values) ? this.values : [this.values!];
            resultData = rowsToInsert.map((row) => {
              const id = row.id ?? uuidv4();
              const newRow = { ...row, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
              table.push(newRow);
              return newRow;
            });
            break;

        case 'update':
            const rowsToUpdate = this.applyFilters(table);
            resultData = [];
            for (const row of rowsToUpdate) {
                const index = table.indexOf(row);
                if (index >= 0) {
                    const newRow = { ...row, ...this.values, updated_at: new Date().toISOString() };
                    table[index] = newRow;
                    resultData.push(newRow);
                }
            }
            break;

        case 'upsert':
            const rowsToUpsert = Array.isArray(this.values) ? this.values : [this.values!];
            resultData = [];
            for (const row of rowsToUpsert) {
                const id = row.id ?? uuidv4();
                const index = table.findIndex((r) => r.id === id);
                const newRow = { ...(index >= 0 ? table[index] : {}), ...row, id, updated_at: new Date().toISOString() };
                if (index >= 0) {
                    table[index] = newRow;
                } else {
                    newRow.created_at = new Date().toISOString();
                    table.push(newRow);
                }
                resultData.push(newRow);
            }
            break;

        case 'delete':
            const remaining: AnyRecord[] = [];
            resultData = [];
            for (const row of table) {
                const match = this.filters.every((f) => row[f.field] === f.value);
                if (match) {
                    resultData.push(row);
                } else {
                    remaining.push(row);
                }
            }
            db[this.table] = remaining;
            break;
    }
    
    if (this.singleResult) {
        if (resultData && resultData.length > 0) {
            return { data: resultData[0], error: null };
        }
        if (this.operation === 'select' && (!resultData || resultData.length === 0)) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data: null, error: null };
    }

    return { data: resultData, error };
  }
}

/**
 * The exported mockSupabase object
 */
export const mockSupabase = {
  auth: {
    async signInWithPassword({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<{ data: { session: Session | null }; error: any }> {
      const profile = db.profiles.find(p => p.email === email);
      
      // SUPER simple: accept any known user with any non-empty password
      if (profile && password) {
         const user: User = {
            id: profile.id,
            app_metadata: { provider: 'email' },
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
            email: profile.email,
        } as unknown as User;

        currentSession = {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "mock-refresh",
          user: user,
        } as unknown as MockSession;
        
        db.login_history.push({ id: uuidv4(), user_id: user.id, email_attempt: email, timestamp: new Date().toISOString(), status: 'Success' });

      } else {
        currentSession = null;
        db.login_history.push({ id: uuidv4(), email_attempt: email, timestamp: new Date().toISOString(), status: 'Failure' });
        notifyAuthSubscribers();
        return { data: { session: null }, error: { message: 'Invalid credentials' } };
      }

      notifyAuthSubscribers();
      return { data: { session: currentSession as Session | null }, error: null };
    },

    async signOut(): Promise<{ error: null }> {
      currentSession = null;
      notifyAuthSubscribers();
      return { error: null };
    },
    
    async signUp(
      { email, password }: { email: string, password?: string }
    ): Promise<{ data: { user: User | null }, error: any }> {
      if (db.profiles.find(p => p.email === email)) {
        return { data: { user: null }, error: { message: 'User already exists' } };
      }
      
      const newUser: User = {
        id: uuidv4(),
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: email,
      } as unknown as User;
      
      // In a real scenario, this would trigger a sign-out of the current user.
      // We will simulate that for admin user creation flow.
      currentSession = null;
      notifyAuthSubscribers();

      return { data: { user: newUser }, error: null };
    },
    
    async resetPasswordForEmail(_email: string, _options?: any): Promise<{ error: null }> {
        // Simulate sending an email
        return { error: null };
    },

    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      return {
        data: { session: currentSession as Session | null },
        error: null,
      };
    },

    onAuthStateChange(
      callback: AuthChangeCallback
    ): { data: { subscription: { unsubscribe: () => void } }; error: null } {
      authSubscribers.add(callback);
      // immediately notify with current state
      callback(currentSession ? "SIGNED_IN" : "SIGNED_OUT", currentSession);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authSubscribers.delete(callback);
            },
          },
        },
        error: null,
      };
    },

    async updateUser(
      _data: AnyRecord
    ): Promise<{ data: { user: User | null }; error: null }> {
      // For the mock, just return the current user
      const user = currentSession?.user ?? null;
      return { data: { user }, error: null };
    },
  },

  from(table: string) {
    return new MockQueryBuilder(table);
  },
};
