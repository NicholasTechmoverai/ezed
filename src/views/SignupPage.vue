<template>
  <div class="flex items-center justify-center min-h-screen">
    <n-card class="w-96 shadow-lg" title="Sign Up" bordered>
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
        size="medium"
      >
        <n-form-item label="Username" path="username">
          <n-input
            v-model:value="formValue.username"
            type="text"
            placeholder="Choose a username"
          />
        </n-form-item>

        <n-form-item label="Email" path="email">
          <n-input
            v-model:value="formValue.email"
            type="text"
            placeholder="Enter your email"
          />
        </n-form-item>

        <n-form-item label="Password" path="password">
          <n-input
            v-model:value="formValue.password"
            type="password"
            show-password-on="click"
            placeholder="Create a password"
          />
        </n-form-item>

        <n-form-item label="Confirm Password" path="confirmPassword">
          <n-input
            v-model:value="formValue.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="Re-enter your password"
          />
        </n-form-item>

        <n-form-item label="Country" path="country">
          <n-select
            v-model:value="formValue.country"
            :options="countries"
            placeholder="Select your country"
          />
        </n-form-item>

        <n-form-item>
          <n-button
            :loading="isLoading"
            type="primary"
            block
            @click="handleSignup"
          >
            {{ isLoading ? "Signing up..." : "Sign Up" }}
          </n-button>
        </n-form-item>
      </n-form>

      <div class="flex items-center my-4">
        <div class="flex-grow h-px bg-gray-300"></div>
        <span class="px-2 text-gray-500 text-sm">OR</span>
        <div class="flex-grow h-px bg-gray-300"></div>
      </div>

      <n-button type="info" ghost block @click="handleGoogleSignup">
        <template #icon>
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            class="w-5 h-5"
          />
        </template>
        Sign up with Google
      </n-button>

      <div class="flex justify-between mt-4 text-sm text-gray-600">
        <router-link to="/auth/reset-password" class="hover:underline">
          Forgot Password?
        </router-link>
        <router-link to="/auth/login" class="hover:underline">
          Already have an account? Login
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
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  country: null,
});

const isLoading = ref(false);

const countries = [
  { label: "Kenya", value: "Kenya" },
  { label: "United States", value: "USA" },
  { label: "United Kingdom", value: "UK" },
  { label: "India", value: "India" },
  { label: "Germany", value: "Germany" },
];

const rules = {
  username: {
    required: true,
    validator(rule, value) {
      if (!value) return new Error("Username is required");
      if (value.length < 3) return new Error("Username must be at least 3 characters");
      return true;
    },
    trigger: ["input", "blur"],
  },
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
  confirmPassword: {
    required: true,
    validator(rule, value) {
      if (!value) return new Error("Please confirm your password");
      if (value !== formValue.value.password) {
        return new Error("Passwords do not match");
      }
      return true;
    },
    trigger: ["input", "blur"],
  },
  country: {
    required: false,
    message: "Please select your country",
    trigger: ["change", "blur"],
  },
};

const handleSignup = (e) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      isLoading.value = true;
      // Simulate async signup
      setTimeout(() => {
        isLoading.value = false;
        message.success("Signup successful!");
      }, 1500);
    } else {
      message.error("Please fix the errors before submitting");
    }
  });
};

const handleGoogleSignup = () => {
  message.info("Redirecting to Google signup...");
  // TODO: integrate Google OAuth
};
</script>
