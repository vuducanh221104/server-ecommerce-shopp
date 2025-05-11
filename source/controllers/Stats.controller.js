import { User, Product, Order } from "../models/index.js";
import { CatchError } from "../config/catchError.js";

class StatsController {
  getDashboardStats = CatchError(async (req, res) => {
    try {
      // Get current month and previous month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Get total users count
      const totalUsers = await User.countDocuments({ status: 1 });
      const prevMonthUsers = await User.countDocuments({
        status: 1,
        createdAt: {
          $lt: new Date(currentYear, currentMonth, 1),
        },
      });
      const userGrowth = prevMonthUsers
        ? Math.round(((totalUsers - prevMonthUsers) / prevMonthUsers) * 100)
        : 100;

      // Get total products count
      const totalProducts = await Product.countDocuments({ isActive: true });
      const prevMonthProducts = await Product.countDocuments({
        isActive: true,
        createdAt: {
          $lt: new Date(currentYear, currentMonth, 1),
        },
      });
      const productGrowth = prevMonthProducts
        ? Math.round(
            ((totalProducts - prevMonthProducts) / prevMonthProducts) * 100
          )
        : 100;

      // Get total orders and sales for current month
      const currentMonthOrders = await Order.find({
        createdAt: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1),
        },
      });
      const prevMonthOrders = await Order.find({
        createdAt: {
          $gte: new Date(prevMonthYear, prevMonth, 1),
          $lt: new Date(currentYear, currentMonth, 1),
        },
      });

      const currentMonthSales = currentMonthOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const prevMonthSales = prevMonthOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      const salesGrowth = prevMonthSales
        ? Math.round(
            ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100
          )
        : 100;
      const orderGrowth = prevMonthOrders.length
        ? Math.round(
            ((currentMonthOrders.length - prevMonthOrders.length) /
              prevMonthOrders.length) *
              100
          )
        : 100;

      // Generate monthly data for charts
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlySalesData = [];
      const monthlyUsersData = [];

      // Get data for the last 9 months
      const startMonth =
        currentMonth - 8 >= 0 ? currentMonth - 8 : 12 + (currentMonth - 8);
      const startYear = currentMonth - 8 >= 0 ? currentYear : currentYear - 1;

      // Generate categories for x-axis
      const chartCategories = [];
      for (let i = 0; i < 9; i++) {
        const monthIndex = (startMonth + i) % 12;
        chartCategories.push(months[monthIndex]);
      }

      // Generate monthly data for sales
      for (let i = 0; i < 9; i++) {
        const monthIndex = (startMonth + i) % 12;
        const year = startMonth + i >= 12 ? startYear + 1 : startYear;

        // Monthly sales (total amount from orders)
        const monthOrders = await Order.find({
          createdAt: {
            $gte: new Date(year, monthIndex, 1),
            $lt: new Date(
              monthIndex === 11 ? year + 1 : year,
              monthIndex === 11 ? 0 : monthIndex + 1,
              1
            ),
          },
        });

        const monthlySales = monthOrders.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        );
        monthlySalesData.push(monthlySales);

        // Monthly new users
        const newUsers = await User.countDocuments({
          createdAt: {
            $gte: new Date(year, monthIndex, 1),
            $lt: new Date(
              monthIndex === 11 ? year + 1 : year,
              monthIndex === 11 ? 0 : monthIndex + 1,
              1
            ),
          },
        });
        monthlyUsersData.push(newUsers);
      }

      return res.status(200).json({
        status: "success",
        data: {
          totalSales: Math.round(currentMonthSales).toLocaleString(),
          salesGrowth: (salesGrowth > 0 ? "+" : "") + salesGrowth + "%",
          totalCustomers: totalUsers.toLocaleString(),
          customerGrowth: (userGrowth > 0 ? "+" : "") + userGrowth + "%",
          totalProducts: totalProducts.toLocaleString(),
          productGrowth: (productGrowth > 0 ? "+" : "") + productGrowth + "%",
          recentOrders: currentMonthOrders.length.toLocaleString(),
          orderGrowth: (orderGrowth > 0 ? "+" : "") + orderGrowth + "%",
          chartData: {
            monthlySales: {
              data: monthlySalesData,
              categories: chartCategories,
            },
            monthlyUsers: {
              data: monthlyUsersData,
              categories: chartCategories,
            },
          },
        },
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to get dashboard statistics",
        error: error.message,
      });
    }
  });
}

export default new StatsController();
