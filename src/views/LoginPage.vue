<template>
    <div class="flex items-center justify-center min-h-screen">
        <n-card class="w-96 shadow-lg" title="Login" bordered>
            <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top" size="medium">
                <n-form-item label="Email" path="email">
                    <n-input v-model:value="formValue.email" type="text" placeholder="Enter your email" />
                </n-form-item>

                <n-form-item label="Password" path="password">
                    <n-input v-model:value="formValue.password" type="password" show-password-on="click"
                        placeholder="Enter your password" />
                </n-form-item>

                <n-form-item>
                    <n-button :loading="isLoading" type="primary" block @click="handleLogin">
                        {{ isLoading ? "Logging in..." : "Login" }}
                    </n-button>
                </n-form-item>
            </n-form>

            <div class="flex items-center my-4">
                <div class="flex-grow h-px bg-gray-300"></div>
                <span class="px-2 text-gray-500 text-sm">OR</span>
                <div class="flex-grow h-px bg-gray-300"></div>
            </div>

            <n-button type="info" ghost block @click="handleGoogleLogin">
                <template #icon>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5" />
                </template>
                Login with Google
            </n-button>

            <div class="flex justify-between mt-4 text-sm text-gray-600">
                <router-link to="/auth/reset-password" @click.prevent="handleForgotPassword" class="hover:underline">
                    Forgot Password?
                </router-link>

                <router-link to="/auth/signup" class="hover:underline" @click.prevent="handleSignup">
                    Create Account
                </router-link>

            </div>
        </n-card>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useMessage } from "naive-ui";

const message = useMessage();
const formRef = ref(null);

const formValue = ref({
    email: "",
    password: "",
});

const isLoading = ref(false);

const rules = {
    email: {
        required: true,
        validator(rule, value) {
            if (!value) return new Error("Email is required");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return new Error("Please enter a valid email");
            }
            return true;
        },
        trigger: ["input", "blur"],
    },
    password: {
        required: true,
        validator(rule, value) {
            if (!value) return new Error("Password is required");
            if (value.length < 6) return new Error("Password must be at least 6 characters");
            return true;
        },
        trigger: ["input", "blur"],
    },
};

const handleLogin = (e) => {
    e.preventDefault();
    formRef.value?.validate((errors) => {
        if (!errors) {
            isLoading.value = true;
            // Simulate async login
            setTimeout(() => {
                isLoading.value = false;
                message.success("Login successful!");
            }, 1500);
        } else {
            message.error("Please fix the errors before submitting");
        }
    });
};

const handleGoogleLogin = () => {
    message.info("Redirecting to Google login...");
    // TODO: integrate real Google OAuth (Firebase, OAuth2, etc.)
};

const handleForgotPassword = () => {
    message.warning("Forgot password clicked");
    // TODO: redirect to forgot password page
};

const handleSignup = () => {
    message.info("Redirecting to signup page...");
    // TODO: navigate to signup route/page
};
</script>
