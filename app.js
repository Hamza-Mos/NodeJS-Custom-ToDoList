//jshint esversion:6
require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const path = require("path");
const _ = require("lodash");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Hello there!"
});

const item2 = new Item({
  name: "Let's add a new item to the To-Do List using the \' + \' sign"
});

const item3 = new Item({
  name: "Go to work and check some items off!"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => 
{

  const day = date.getDate();

  //array of custom lists
  let allCustomLists = [];

  //Get all lists to display in nav bar
  List.find({}, (err, lists) => 
  {
    if (err)
    {
      console.log(err);
    }

    else
    {
      allCustomLists = lists;
    }
  });

  Item.find({}, (err, items) => 
  {
    if (err) 
    {
      console.log(err);
    }

    else 
    {

      if (items.length === 0) 
      {
        Item.insertMany(defaultItems, (err) => 
        {
          if (err) 
          {
            console.log(err);
          } else 
          {
            console.log("Successfully inserted the default items!");
          }
        });

        res.redirect("/");
      }

      else 
      {
        res.render("list", 
        {
          listTitle: day,
          newListItems: items,
          foundLists: allCustomLists
        });
      }
    }
  });
});

app.post("/", (req, res) =>
{
  const itemName = req.body.newItem;
  const listName = req.body.list;

  console.log("made post request to root route");

  const newItem = new Item
  ({
    name: itemName
  });

  if(listName === date.getDate()) 
  {
    newItem.save().then(() => console.log("New item logged to default list!"));
    res.redirect("/")
  } 
  
  else 
  {
      List.findOne({name: listName}, (err, foundList) => 
      {
        if(!err) 
        {
          foundList.items.push(newItem);
          foundList.save().then(() => console.log("New item logged to custom list!"));
          res.redirect("/list/" + listName);
        }
      })
    }
});

app.post("/delete", (req, res) => 
{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === date.getDate()) 
  {
    Item.findByIdAndRemove(checkedItemId, (err) => 
    {
      if (err) 
      {
        console.log(err);
      } 
      
      else 
      {
        console.log("Successfully deleted an item!");
        res.redirect("/");
      }
    });
  } 
  
  else 
  {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => 
    {
      if(!err) 
      {
        res.redirect("/list/" + listName);
      }
    })
  }
});

app.post("/list/:customListName", (req, res) =>
{
  //Capitalize Custom list name
  const customListName = _.capitalize(req.params.customListName);

  console.log("made post request to custom list url");

  //Find custom list in data base
  List.findOne({name: customListName}, (err, foundList) => 
  {
    if (!err) 
    {
      // if not found, then create and save list
      if (!foundList) 
      {
        const list = new List
        ({
          name: customListName,
          items: defaultItems
        });

        list.save().then(() => console.log("New list logged!"));

        foundList = list;
      }

      //render custom list page
      res.redirect("/list/" + customListName);

    } 
    
    else 
    {
      console.log(err);
    }
  });
});

//Get a custom list
app.get("/list/:customListName", (req, res) => 
{
  //Capitalize Custom list name
  const customListName = req.params.customListName;

  //array of custom lists
  let allCustomLists = [];

  //Get all lists to display in nav bar
  List.find({}, (err, lists) => 
  {
    if (err)
    {
      console.log(err);
    }

    else
    {
      allCustomLists = lists;
    }
  });

  //Find custom list in data base
  List.findOne({name: customListName}, (err, foundList) => 
  {
    if (!err) 
    {
      //render custom list page
      res.render("list", 
      {
        listTitle: _.capitalize(foundList.name),
        newListItems: foundList.items,
        foundLists: allCustomLists
      });

    } 
    
    else 
    {
      console.log(err);
    }
  });
});

app.listen(process.env.PORT, () => 
{
  console.log("Server started on port 3000");
});
