exports.up = function(knex) {
    return knex.schema
        // Users table
        .createTable('users', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.string('email').unique().notNullable();
            table.string('password_hash').notNullable();
            table.string('business_name').notNullable();
            table.string('phone_number').unique();
            table.string('business_type');
            table.string('location');
            table.jsonb('business_settings').defaultTo('{}');
            table.jsonb('voice_preferences').defaultTo('{}');
            table.boolean('is_active').defaultTo(true);
            table.boolean('is_verified').defaultTo(false);
            table.timestamp('email_verified_at');
            table.timestamp('last_login_at');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['email']);
            table.index(['phone_number']);
            table.index(['business_type']);
            table.index(['location']);
        })
        
        // Transactions table
        .createTable('transactions', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('mpesa_transaction_id').unique();
            table.decimal('amount', 15, 2).notNullable();
            table.string('transaction_type'); // 'received', 'sent', 'withdrawal', 'deposit'
            table.string('sender_name');
            table.string('sender_phone');
            table.string('recipient_name');
            table.string('recipient_phone');
            table.string('account_number');
            table.string('business_short_code');
            table.string('invoice_number');
            table.string('org_account_balance');
            table.string('middleware');
            table.text('sms_content');
            table.jsonb('parsed_data').defaultTo('{}');
            table.string('category').defaultTo('uncategorized');
            table.string('subcategory');
            table.boolean('is_processed').defaultTo(false);
            table.jsonb('ai_insights').defaultTo('{}');
            table.timestamp('transaction_date');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['mpesa_transaction_id']);
            table.index(['transaction_date']);
            table.index(['category']);
            table.index(['amount']);
        })
        
        // Business DNA Analysis table
        .createTable('business_dna', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.integer('health_score').defaultTo(0);
            table.jsonb('patterns').defaultTo('{}');
            table.jsonb('seasonal_data').defaultTo('{}');
            table.jsonb('predictions').defaultTo('{}');
            table.jsonb('risk_factors').defaultTo('{}');
            table.jsonb('opportunities').defaultTo('{}');
            table.timestamp('last_analysis_at');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['health_score']);
        })
        
        // Voice Commands table
        .createTable('voice_commands', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.text('voice_input');
            table.text('processed_command');
            table.string('command_type'); // 'analytics', 'transaction', 'inventory', 'report'
            table.jsonb('parameters').defaultTo('{}');
            table.text('voice_response');
            table.boolean('was_successful').defaultTo(false);
            table.jsonb('execution_result').defaultTo('{}');
            table.timestamp('executed_at');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['command_type']);
            table.index(['executed_at']);
        })
        
        // Community Network table
        .createTable('community_network', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('network_name');
            table.string('network_type'); // 'supplier', 'buyer', 'competitor', 'partner'
            table.string('contact_name');
            table.string('contact_phone');
            table.string('contact_email');
            table.string('business_type');
            table.string('location');
            table.decimal('trust_score', 3, 2).defaultTo(0.5);
            table.jsonb('interaction_history').defaultTo('[]');
            table.boolean('is_verified').defaultTo(false);
            table.boolean('is_active').defaultTo(true);
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['network_type']);
            table.index(['trust_score']);
            table.index(['location']);
        })
        
        // Learning Progress table
        .createTable('learning_progress', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('course_id');
            table.string('course_title');
            table.string('course_category');
            table.integer('progress_percentage').defaultTo(0);
            table.boolean('is_completed').defaultTo(false);
            table.integer('score').defaultTo(0);
            table.jsonb('quiz_results').defaultTo('[]');
            table.timestamp('started_at');
            table.timestamp('completed_at');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['course_id']);
            table.index(['is_completed']);
        })
        
        // Analytics Cache table
        .createTable('analytics_cache', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('cache_key').notNullable();
            table.jsonb('cache_data').defaultTo('{}');
            table.timestamp('expires_at');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['cache_key']);
            table.index(['expires_at']);
        })
        
        // Notifications table
        .createTable('notifications', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('type'); // 'alert', 'insight', 'reminder', 'achievement'
            table.string('title').notNullable();
            table.text('message').notNullable();
            table.jsonb('data').defaultTo('{}');
            table.boolean('is_read').defaultTo(false);
            table.boolean('is_urgent').defaultTo(false);
            table.timestamp('read_at');
            table.timestamps(true, true);
            
            // Indexes
            table.index(['user_id']);
            table.index(['type']);
            table.index(['is_read']);
            table.index(['created_at']);
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('notifications')
        .dropTableIfExists('analytics_cache')
        .dropTableIfExists('learning_progress')
        .dropTableIfExists('community_network')
        .dropTableIfExists('voice_commands')
        .dropTableIfExists('business_dna')
        .dropTableIfExists('transactions')
        .dropTableIfExists('users');
};
