-- =====================================================
-- CareLoop Database Schema
-- Supabase PostgreSQL
-- =====================================================


-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================
-- PROFILES TABLE
-- Syncs with Supabase auth.users
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);


DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);



-- =====================================================
-- USER CREATION TRIGGER
-- Automatically creates profile after signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO public.profiles
    (
        id,
        email,
        full_name,
        avatar_url,
        role
    )

    VALUES
    (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            ''
        ),

        COALESCE(
            new.raw_user_meta_data->>'avatar_url',
            ''
        ),

        'user'
    );

    RETURN NEW;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created

AFTER INSERT ON auth.users

FOR EACH ROW

EXECUTE FUNCTION public.handle_new_user();



-- =====================================================
-- REMINDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reminders (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

    title TEXT NOT NULL,

    message TEXT,

    schedule_time TEXT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Users can view their own reminders"
ON public.reminders;


CREATE POLICY "Users can view their own reminders"

ON public.reminders

FOR SELECT

USING (auth.uid() = user_id);



DROP POLICY IF EXISTS "Users can insert their own reminders"
ON public.reminders;


CREATE POLICY "Users can insert their own reminders"

ON public.reminders

FOR INSERT

WITH CHECK (auth.uid() = user_id);



DROP POLICY IF EXISTS "Users can update their own reminders"
ON public.reminders;


CREATE POLICY "Users can update their own reminders"

ON public.reminders

FOR UPDATE

USING (auth.uid() = user_id);



DROP POLICY IF EXISTS "Users can delete their own reminders"
ON public.reminders;


CREATE POLICY "Users can delete their own reminders"

ON public.reminders

FOR DELETE

USING (auth.uid() = user_id);




-- =====================================================
-- REMINDER HISTORY TABLE
-- =====================================================


CREATE TABLE IF NOT EXISTS public.reminder_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,


    reminder_id UUID NOT NULL
    REFERENCES public.reminders(id)
    ON DELETE CASCADE,


    status TEXT NOT NULL
    CHECK(status IN ('sent','completed','snoozed')),


    action_time TIMESTAMP WITH TIME ZONE,


    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

);



ALTER TABLE public.reminder_history ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Users can view their own reminder logs"
ON public.reminder_history;


CREATE POLICY "Users can view their own reminder logs"

ON public.reminder_history

FOR SELECT

USING (auth.uid() = user_id);



DROP POLICY IF EXISTS "Users can insert their own reminder logs"
ON public.reminder_history;


CREATE POLICY "Users can insert their own reminder logs"

ON public.reminder_history

FOR INSERT

WITH CHECK (auth.uid() = user_id);




-- =====================================================
-- NUTRITION LOGS TABLE
-- =====================================================


CREATE TABLE IF NOT EXISTS public.nutrition_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,


    meal_type TEXT NOT NULL
    CHECK(
        meal_type IN
        (
        'breakfast',
        'lunch',
        'dinner',
        'snack',
        'water'
        )
    ),


    food_name TEXT,


    calories REAL DEFAULT 0,

    protein REAL DEFAULT 0,

    carbs REAL DEFAULT 0,

    fat REAL DEFAULT 0,

    water_amount REAL DEFAULT 0,


    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

);



ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;




DROP POLICY IF EXISTS "Users can view their own nutrition logs"
ON public.nutrition_logs;


CREATE POLICY "Users can view their own nutrition logs"

ON public.nutrition_logs

FOR SELECT

USING (auth.uid() = user_id);




DROP POLICY IF EXISTS "Users can insert their own nutrition logs"
ON public.nutrition_logs;


CREATE POLICY "Users can insert their own nutrition logs"

ON public.nutrition_logs

FOR INSERT

WITH CHECK (auth.uid() = user_id);




DROP POLICY IF EXISTS "Users can update their own nutrition logs"
ON public.nutrition_logs;


CREATE POLICY "Users can update their own nutrition logs"

ON public.nutrition_logs

FOR UPDATE

USING (auth.uid() = user_id);




DROP POLICY IF EXISTS "Users can delete their own nutrition logs"
ON public.nutrition_logs;


CREATE POLICY "Users can delete their own nutrition logs"

ON public.nutrition_logs

FOR DELETE

USING (auth.uid() = user_id);



-- =====================================================
-- UPDATED_AT AUTO UPDATE FUNCTION
-- =====================================================


CREATE OR REPLACE FUNCTION update_updated_at_column()

RETURNS TRIGGER AS $$

BEGIN

NEW.updated_at = CURRENT_TIMESTAMP;

RETURN NEW;

END;

$$ LANGUAGE plpgsql;



DROP TRIGGER IF EXISTS update_profiles_updated_at
ON public.profiles;


CREATE TRIGGER update_profiles_updated_at

BEFORE UPDATE ON public.profiles

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();



DROP TRIGGER IF EXISTS update_reminders_updated_at
ON public.reminders;


CREATE TRIGGER update_reminders_updated_at

BEFORE UPDATE ON public.reminders

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();




-- =====================================================
-- INDEXES
-- =====================================================


CREATE INDEX IF NOT EXISTS idx_reminders_user_id

ON public.reminders(user_id);



CREATE INDEX IF NOT EXISTS idx_reminder_history_user_id

ON public.reminder_history(user_id);



CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id

ON public.nutrition_logs(user_id);



-- =====================================================
-- END OF CARELOOP SCHEMA
-- =====================================================